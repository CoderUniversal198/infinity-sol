// Test process preload only. Never loaded by dev, build, start, or Vercel.
const originalFetch = globalThis.fetch;
globalThis.fetch = function (input, init) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url === 'https://openrouter.ai/api/v1/chat/completions') {
    return originalFetch(process.env.NW_TEST_PROVIDER_URL, init);
  }
  return originalFetch(input, init);
};

// The production driver is externalized. Route its parameterized SQL to the
// integration test's real embedded Postgres without touching the hosted DB.
if (process.env.NW_TEST_SQL_URL) {
  const pg = require('pg');
  class TestPool {
    on() { return this; }
    async query(sql, parameters = []) {
      const response = await originalFetch(process.env.NW_TEST_SQL_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, parameters })
      });
      const result = await response.json();
      if (!response.ok) { const error = new Error(result.message); error.code = result.code; throw error; }
      return result;
    }
  }
  // The pg ESM wrapper re-exports this CommonJS singleton as well.
  pg.Pool = TestPool;
}
