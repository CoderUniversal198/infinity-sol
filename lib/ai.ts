import { AppError } from './errors';
export async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key.startsWith('your-')) throw new AppError(503, 'AI is not configured. Ask the administrator to add the OpenRouter API key.');
  let response: Response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(35000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', 'X-Title': 'NovaWorks CRM' },
      body: JSON.stringify({ model: process.env.AI_MODEL || 'anthropic/claude-3-5-haiku',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
        temperature: 0.1, max_tokens: 8192 })
    });
  } catch { throw new AppError(504, 'The AI service did not respond in time. Your transcript is still here; please try again.'); }
  if (!response.ok) {
    if (response.status === 429) throw new AppError(429, 'The AI service is busy or rate-limited. Please wait a moment and try again.');
    if ([401, 402, 403].includes(response.status)) throw new AppError(502, 'The AI provider rejected the request. Ask the administrator to check the API key and credits.');
    if (response.status === 400 || response.status === 404) throw new AppError(502, 'The AI model is unavailable or does not support this request. Ask the administrator to check AI_MODEL.');
    throw new AppError(502, 'The AI service could not process this transcript. Please try again.');
  }
  const data = await response.json();
  if (data.choices?.[0]?.finish_reason === 'length') throw new AppError(400, 'The AI response was cut short. Use a shorter transcript and try again.');
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new AppError(502, 'The AI returned an empty response. Please try again.');
  return content;
}
