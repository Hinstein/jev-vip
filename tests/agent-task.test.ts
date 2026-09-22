import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAgentIntegrationTask } from '../lib/jev/agent-task';

test('agent task installs the official skill and keeps calls on the JEV gateway', () => {
  const task = buildAgentIntegrationTask({
    baseUrl: 'https://jevhub.store',
    locale: 'en',
  });

  assert.match(task, /claude plugin marketplace add typesafe-ai\/skills/);
  assert.match(task, /claude plugin install typesafe@typesafe-ai/);
  assert.match(task, /npx skills add typesafe-ai\/skills --skill typesafe-ai/);
  assert.match(
    task,
    /https:\/\/github\.com\/typesafe-ai\/skills\/blob\/main\/skills\/typesafe-ai\/SKILL\.md/
  );
  assert.match(
    task,
    /https:\/\/raw\.githubusercontent\.com\/typesafe-ai\/skills\/main\/skills\/typesafe-ai\/SKILL\.md/
  );
  assert.match(task, /POST https:\/\/jevhub\.store\/api\/v1\/decide/);
  assert.match(task, /JEV_API_KEY/);
  assert.match(task, /Do not send model/);
  assert.match(task, /Never ask the user to paste a live API key into the agent chat/);
  assert.match(task, /Do not call https:\/\/api\.typesafe\.ai\/v1\/systemone directly/);
});

test('Chinese agent task preserves the JEV gateway boundary', () => {
  const task = buildAgentIntegrationTask({
    baseUrl: 'https://jevhub.store',
    locale: 'zh-CN',
  });

  assert.match(task, /只能选择以下一种安装方式/);
  assert.match(task, /POST https:\/\/jevhub\.store\/api\/v1\/decide/);
  assert.match(task, /不能直接调用 https:\/\/api\.typesafe\.ai\/v1\/systemone/);
  assert.match(task, /不要让用户在 Agent 对话中粘贴真实 API Key/);
});
