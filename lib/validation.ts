import { z } from 'zod';
import type { TeamMember } from './types';
import { AppError } from './errors';
export function isValidDate(value: string) {
  return /^2026-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
const date = z.string().refine(isValidDate, 'Use a real calendar date in YYYY-MM-DD format, in 2026.');
const text = z.string().trim().min(1).max(500);
const taskSchema = z.object({
  title: text, description: z.string().trim().max(5000).optional().default(''),
  assigneeId: text, deadline: date, estimatedHours: z.number().finite().positive()
}).strict();
export const planSchema = z.object({ projects: z.array(z.object({
  name: text, clientName: text, description: z.string().trim().max(5000).optional().default(''),
  managerId: text, deadline: date, tasks: z.array(taskSchema).min(1).max(200)
}).strict()).min(1).max(30) }).strict();
export type ExtractedPlan = z.infer<typeof planSchema>;
export function validateAIOutput(input: unknown, users: Pick<TeamMember, 'reference_id' | 'role'>[]) {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) throw new AppError(400, 'The AI returned incomplete or invalid project data. Check the transcript and try again.',
    parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`));
  const directory = new Map(users.map(u => [u.reference_id, u]));
  const errors: string[] = [];
  for (const project of parsed.data.projects) {
    if (directory.get(project.managerId)?.role !== 'MANAGER') errors.push(`${project.name}: ${project.managerId} must be an existing manager.`);
    for (const task of project.tasks) {
      if (directory.get(task.assigneeId)?.role !== 'AGENT') errors.push(`${task.title}: ${task.assigneeId} must be an existing agent.`);
      if (task.deadline > project.deadline) errors.push(`${task.title}: task deadline exceeds the project deadline.`);
    }
  }
  if (errors.length) throw new AppError(400, 'The AI plan could not be saved. Correct the people or dates in the transcript.', errors);
  return parsed.data;
}
export function parseAIOutput(raw: string): unknown {
  // Some providers wrap JSON despite the prompt; strip only an outer code fence.
  const clean = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(clean); } catch { throw new AppError(400, 'The AI did not return valid JSON. Please try again.'); }
}
