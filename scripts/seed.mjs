const url = process.argv[2] || 'http://localhost:3000';
try {
  const response = await fetch(new URL('/api/seed', url), { method: 'POST' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  console.log(result);
} catch (error) { console.error(error.message); process.exitCode = 1; }
