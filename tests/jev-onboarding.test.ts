import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import { createJevClient, JevError } from '../public/docs/examples/jev-client';
import nextConfig from '../next.config';

const request = {
  state: { message: 'Please correct my receipt.' },
  questions: {
    department: { type: 'choice' as const, instructions: 'Which team?', criteria: { billing: 'Invoices', other: 'Anything else' } },
    impact: { type: 'score' as const, instructions: 'How much impact?', criteria: ['Usable', 'Blocked'] },
    refund: { type: 'noul' as const, instructions: 'Explicit refund request?' }
  }
};
const response = {
  answers: {
    department: { type: 'choice', choice: 'billing', probabilities: { billing: 1, other: 0 }, confidence: 1 },
    impact: { type: 'score', score: 0.2, probabilities: { '0': 0.8, '1': 0.2 }, legend: { '0': 'Usable', '1': 'Blocked' }, confidence: 0.6 },
    refund: { type: 'noul', noul: 0.02 }
  }, usage: { input_tokens: 180 }
};

test('customer client: contract, errors, retry limits and safe failure', async t => {
  // Never access real credentials: test context supplies a synthetic process environment.
  const environment = Object.getOwnPropertyDescriptor(process, 'env')!;
  Object.defineProperty(process, 'env', { value: { JEV_API_KEY: 'test-placeholder-not-a-real-key' }, configurable: true });
  t.after(() => Object.defineProperty(process, 'env', environment));
  await t.test('only gateway, two body fields, named answers and usage', async () => {
    const metrics: number[] = [];
    const decide = createJevClient({
      onUsage: u => metrics.push(u.input_tokens),
      fetch: async (url, init) => {
        assert.equal(url, 'https://jevhub.store/api/v1/decide');
        assert.equal(init?.method, 'POST');
        assert.equal(init?.redirect, 'error');
        assert.equal(init?.cache, 'no-store');
        assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer test-placeholder-not-a-real-key');
        assert.deepEqual(Object.keys(JSON.parse(String(init?.body))).sort(), ['questions', 'state']);
        return Response.json(response);
      }
    });
    const result = await decide({ ...request, model: 'must-not-be-sent' } as typeof request);
    assert.equal(result.answers.department.choice, 'billing');
    assert.equal(result.answers.impact.score, 0.2);
    assert.equal(result.answers.refund.noul, 0.02);
    assert.deepEqual(metrics, [180]);
  });
  for (const status of [400, 401, 402, 403, 422, 500, 529]) {
    await t.test(`HTTP ${status} not retried and raw response hidden`, async () => {
      let count = 0;
      const decide = createJevClient({ onUsage() {}, fetch: async () => {
        count++; return new Response('private upstream data', { status });
      } });
      await assert.rejects(decide(request), (e: JevError) => {
        assert.equal(e.status, status);
        assert.doesNotMatch(e.message, /private upstream/);
        if (status === 401) assert.match(e.message, /invalid or revoked/);
        if (status === 402) assert.match(e.message, /Top up/);
        return true;
      });
      assert.equal(count, 1);
    });
  }
  for (const status of [429, 503]) {
    await t.test(`HTTP ${status} exponential delays then recovery`, async () => {
      let count = 0; const delays: number[] = [];
      const decide = createJevClient({ onUsage() {}, sleep: async ms => { delays.push(ms); }, fetch: async () => {
        return ++count < 3 ? new Response(null, { status }) : Response.json(response);
      } });
      await decide(request);
      assert.equal(count, 3);
      assert.ok(delays[0] >= 500 && delays[0] < 750);
      assert.ok(delays[1] >= 1000 && delays[1] < 1250);
    });
    await t.test(`HTTP ${status} stops after three attempts`, async () => {
      let count = 0;
      const decide = createJevClient({ onUsage() {}, sleep: async () => {}, fetch: async () => {
        count++; return new Response(null, { status });
      } });
      await assert.rejects(decide(request), { status });
      assert.equal(count, 3);
    });
  }
  await t.test('respects Retry-After and stops for long waits', async () => {
    let count = 0; const delays: number[] = [];
    const decide = createJevClient({ onUsage() {}, sleep: async ms => { delays.push(ms); }, fetch: async () => {
      return ++count === 1 ? new Response(null, { status: 429, headers: { 'Retry-After': '2' } }) : Response.json(response);
    } });
    await decide(request); assert.deepEqual(delays, [2000]);
    const later = createJevClient({ onUsage() {}, fetch: async () => new Response(null, { status: 503, headers: { 'Retry-After': '60' } }) });
    await assert.rejects(later(request), { code: 'RETRY_LATER' });
  });
  await t.test('missing key fails before fetch', async () => {
    delete process.env.JEV_API_KEY;
    try {
      const decide = createJevClient({ onUsage() {}, fetch: async () => { assert.fail('must not call'); } });
      await assert.rejects(decide(request), { code: 'MISSING_KEY' });
    } finally { process.env.JEV_API_KEY = 'test-placeholder-not-a-real-key'; }
  });
  await t.test('network/abort failure is sanitized and never replayed', async () => {
    let count = 0;
    const decide = createJevClient({ onUsage() {}, fetch: async () => {
      count++; throw new Error('private authorization data');
    } });
    await assert.rejects(decide(request), (e: JevError) => {
      assert.equal(e.code, 'NETWORK_ERROR'); assert.doesNotMatch(e.message, /private authorization/); return true;
    });
    assert.equal(count, 1);
  });
  await t.test('timeout aborts transport once', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const decide = createJevClient({ onUsage() {}, fetch: async (_, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }) });
    const pending = assert.rejects(decide(request), { code: 'NETWORK_ERROR' });
    t.mock.timers.tick(15_000);
    await pending;
  });
  for (const bad of [
    {}, { ...response, usage: { input_tokens: -1 } },
    { ...response, answers: { ...response.answers, refund: { type: 'noul', noul: 2 } } },
    { ...response, answers: { ...response.answers, department: { ...response.answers.department, choice: 'unknown' } } },
    { ...response, answers: { ...response.answers, impact: { ...response.answers.impact, score: 3 } } }
  ]) {
    await t.test('rejects malformed result without recording usage', async () => {
      const decide = createJevClient({ onUsage() { assert.fail('invalid result'); }, fetch: async () => Response.json(bad) });
      await assert.rejects(decide(request), { code: 'INVALID_RESPONSE' });
    });
  }
  await t.test('rejects invalid JSON without replay', async () => {
    const decide = createJevClient({ onUsage() {}, fetch: async () => new Response('not-json') });
    await assert.rejects(decide(request), { code: 'INVALID_RESPONSE' });
  });
  await t.test('isolated customer import has no repository dependencies', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'jev-customer-smoke-'));
    try {
      const path = join(directory, 'jev-client.ts');
      await copyFile('public/docs/examples/jev-client.ts', path);
      const client = await import(pathToFileURL(path).href);
      const decide = client.createJevClient({ onUsage() {}, fetch: async () => Response.json(response) });
      assert.equal((await decide(request)).answers.department.choice, 'billing');
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});

test('public docs and full clipboard task work without upstream installation', async () => {
  const headers = await nextConfig.headers!();
  assert.ok(headers.some(rule => rule.source === '/docs/examples/jev-client.ts' &&
    rule.headers.some(header => header.key === 'Content-Type' && header.value.startsWith('text/plain'))));
  const html = await readFile('public/docs/quickstart.html', 'utf8');
  const agent = await readFile('public/docs/agent.md', 'utf8');
  const task = html.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/)?.[1];
  assert.ok(task);
  for (const text of [html, agent, task]) {
    assert.match(text, /JEV_API_KEY/);
    assert.match(text, /usage.input_tokens/);
    assert.match(text, /429/); assert.match(text, /503/);
    assert.doesNotMatch(text, /npx skills add|claude plugin|阅读官方|https:\/\/api.typesafe.ai/);
  }
  for (const path of ['/docs/quickstart.html', '/docs/agent.md', '/docs/examples/jev-client.ts']) {
    assert.ok(task.includes(`https://jevhub.store${path}`));
    assert.ok((await readFile(`public${path}`, 'utf8')).length > 100);
  }
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  for (const fail of [false, true]) {
    let click: () => Promise<void> = async () => {};
    let copied = ''; let selected = false;
    const elements = {
      'copy-task': { addEventListener: (_: string, cb: typeof click) => { click = cb; } },
      'agent-task': { value: task, focus() {}, select() { selected = true; } },
      'copy-status': { textContent: '' }, 'task-details': { open: false }
    };
    runInNewContext(script, {
      document: { getElementById: (id: keyof typeof elements) => elements[id] },
      navigator: { clipboard: { writeText: async (text: string) => { if (fail) throw new Error('denied'); copied = text; } } }
    });
    await click();
    if (fail) { assert.ok(elements['task-details'].open); assert.ok(selected); }
    else { assert.equal(copied, task); assert.match(elements['copy-status'].textContent, /已复制/); }
  }
});
