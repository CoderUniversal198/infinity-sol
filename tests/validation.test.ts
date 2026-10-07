import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from './fixtures/expected-plan.json';
import { DEMO_USERS } from '../lib/seed-data';
import { validateAIOutput, parseAIOutput } from '../lib/validation';
test('reference plan validates with 3 projects, 12 tasks and 124 effort hours', () => {
  const plan = validateAIOutput(fixture, [...DEMO_USERS]);
  assert.equal(plan.projects.length, 3);
  const tasks = plan.projects.flatMap(p => p.tasks);
  assert.equal(tasks.length, 12);
  assert.equal(tasks.reduce((n, t) => n + t.estimatedHours, 0), 124);
});
test('different valid project counts and changed input values are not hardcoded', () => {
  const plan = structuredClone(fixture); plan.projects = plan.projects.slice(1, 2);
  plan.projects[0].tasks[3].estimatedHours = 12; plan.projects[0].tasks[3].deadline = '2026-10-23';
  const result = validateAIOutput(plan, [...DEMO_USERS]);
  assert.equal(result.projects.length, 1); assert.equal(result.projects[0].tasks[3].estimatedHours, 12);
});
for (const [label, mutate] of Object.entries({
  'external employee': (p: typeof fixture) => { p.projects[0].tasks[0].assigneeId = 'Kamran'; },
  'manager used as agent': (p: typeof fixture) => { p.projects[0].tasks[0].assigneeId = 'PM01'; },
  'agent used as manager': (p: typeof fixture) => { p.projects[0].managerId = 'DEV01'; },
  'impossible date': (p: typeof fixture) => { p.projects[0].deadline = '2026-02-31'; },
  'wrong year': (p: typeof fixture) => { p.projects[0].deadline = '2027-10-20'; },
  'task past project deadline': (p: typeof fixture) => { p.projects[0].tasks[0].deadline = '2026-10-21'; },
  'zero hours': (p: typeof fixture) => { p.projects[0].tasks[0].estimatedHours = 0; },
  'negative hours': (p: typeof fixture) => { p.projects[0].tasks[0].estimatedHours = -5; },
  'blank name': (p: typeof fixture) => { p.projects[0].name = '  '; },
  'missing tasks': (p: typeof fixture) => { p.projects[0].tasks = []; }
})) test(`rejects ${label}`, () => {
  const plan = structuredClone(fixture); mutate(plan); assert.throws(() => validateAIOutput(plan, [...DEMO_USERS]));
});
test('rejects numeric strings, null entries and unexpected schema', () => {
  assert.throws(() => validateAIOutput({ projects: [null] }, [...DEMO_USERS]));
  const plan = structuredClone(fixture) as any; plan.projects[0].tasks[0].estimatedHours = '12';
  assert.throws(() => validateAIOutput(plan, [...DEMO_USERS]));
  assert.throws(() => validateAIOutput({ projects: [] }, [...DEMO_USERS]));
});
test('strips optional outer JSON fence but rejects incomplete responses', () => {
  assert.deepEqual(parseAIOutput('```json\n{"projects": []}\n```'), { projects: [] });
  assert.throws(() => parseAIOutput('Here is the result: {}'));
  assert.throws(() => parseAIOutput('{"projects": ['));
});
