import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { buildAgentIntegrationTask } from '../lib/jev/agent-task';

for (const locale of ['en', 'zh-CN'] as const) {
  test(locale + ' task uses hosted resources without mandatory installation', () => {
    const task = buildAgentIntegrationTask({ baseUrl: 'https://jevhub.store', locale });
    for (const path of ['/docs/agent.md', '/docs/decision-design.md', '/docs/examples/jev-client.ts', '/docs/quickstart.html', '/api/v1/decide']) {
      assert.ok(task.includes('https://jevhub.store' + path));
    }
    for (const value of ['JEV_API_KEY', 'usage.input_tokens', 'state', 'questions', '429', '503', '401', '402', 'model']) assert.ok(task.includes(value));
    assert.doesNotMatch(task, /npx skills add|claude plugin|github.com|api.typesafe.ai/);
    assert.match(task, /server-only/);
    assert.match(task, /mock/);
  });
}

test('Chinese dashboard task matches standalone guide exactly', () => {
  const html = readFileSync('public/docs/quickstart.html', 'utf8');
  const text = html.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/)?.[1];
  assert.equal(buildAgentIntegrationTask({ baseUrl: 'https://jevhub.store', locale: 'zh-CN' }), text);
});

test('resources follow the configured origin', () => {
  const task = buildAgentIntegrationTask({ baseUrl: 'https://example.test/', locale: 'en' });
  assert.ok(task.includes('https://example.test/docs/agent.md'));
  assert.doesNotMatch(task, /https:\/\/jevhub.store/);
});
