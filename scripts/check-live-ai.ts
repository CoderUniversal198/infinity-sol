// Calls the real AI twice; does not insert database records. Uses your API credits.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { callAI } from '../lib/ai';
import { AI_SYSTEM_PROMPT } from '../lib/ai-prompt';
import { DEMO_USERS } from '../lib/seed-data';
import { parseAIOutput, validateAIOutput, type ExtractedPlan } from '../lib/validation';
import expected from '../tests/fixtures/expected-plan.json';
async function main() {
  const directory = DEMO_USERS.map(({ reference_id, name, role, specialization, skills }) => ({ reference_id, name, role, specialization, skills }));
  const prompt = AI_SYSTEM_PROMPT.replace('{DIRECTORY_JSON}', JSON.stringify(directory, null, 2));
  for (const file of ['meeting-transcript.txt', 'meeting-transcript-modified.txt']) {
    const plan = validateAIOutput(parseAIOutput(await callAI(prompt, readFileSync(`examples/${file}`, 'utf8'))), [...DEMO_USERS]);
    assert.equal(plan.projects.length, 3);
    for (const reference of expected.projects) {
      const project = plan.projects.find(p => p.name === reference.name); assert.ok(project, `Missing ${reference.name}`);
      assert.equal(project.clientName, reference.clientName); assert.equal(project.managerId, reference.managerId); assert.equal(project.deadline, reference.deadline);
      assert.equal(project.tasks.length, reference.tasks.length);
      for (const task of reference.tasks) {
        const actual: ExtractedPlan['projects'][number]['tasks'][number] | undefined = project.tasks.find(t => t.title === task.title); assert.ok(actual, `Missing ${task.title}`);
        const changed = file.includes('modified') && task.title === 'Mobile integration and testing';
        assert.equal(actual.assigneeId, task.assigneeId);
        assert.equal(actual.deadline, changed ? '2026-10-23' : task.deadline);
        assert.equal(actual.estimatedHours, changed ? 12 : task.estimatedHours);
      }
    }
    console.log(`PASS live AI: ${file}`);
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
