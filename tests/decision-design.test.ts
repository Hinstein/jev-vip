import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createJevClient } from '../public/docs/examples/jev-client';

const guide = readFileSync('public/docs/decision-design.md', 'utf8');
const request = JSON.parse(guide.match(/```json\n([\s\S]*?)\n```/)![1]);
const code = guide.match(/```js\n([\s\S]*?)\n```/)![1];
const planTicket = runInNewContext(`${code}\nplanTicket`);
// Synthetic policy for branch tests, not evidence of model accuracy.
const policy = { validated: true, routeConfidence: 0.8, refundYes: 0.8, refundNo: 0.2, impactConfidence: 0.7, highImpact: 1.5 };
function result(team = 'billing', confidence = 0.9, refund = 0.1, impact = 2, impactConfidence = 0.9) {
  return { answers: {
    department: { type: 'choice', choice: team, confidence, probabilities: { billing: 0.95, technical: 0.04, other: 0.01 } },
    wants_refund: { type: 'noul', noul: refund },
    impact: { type: 'score', score: impact, confidence: impactConfidence, probabilities: { '0': 0, '1': 0, '2': 1 }, legend: { '0': 'usable', '1': 'workaround', '2': 'blocked' } }
  }, usage: { input_tokens: 180 } };
}

test('design guide is linked from entrypoints and contains a two-field request', () => {
  for (const path of ['public/docs/agent.md', 'public/docs/quickstart.html', 'lib/jev/agent-task.ts']) {
    assert.ok(readFileSync(path, 'utf8').includes('/docs/decision-design.md'));
  }
  assert.deepEqual(Object.keys(request).sort(), ['questions', 'state']);
  assert.deepEqual(Object.values(request.questions).map((q: any) => q.type).sort(), ['choice', 'noul', 'score']);
  assert.ok(request.questions.department.criteria.other);
  for (const concept of ['决策设计卡', '保留集', '影子运行', '候选覆盖', '不是授权', 'mock只证明']) assert.ok(guide.includes(concept), concept);
});

test('guide JSON passes the actual customer reference client with mocked transport', async t => {
  const environment = Object.getOwnPropertyDescriptor(process, 'env')!;
  Object.defineProperty(process, 'env', { value: { JEV_API_KEY: 'test-placeholder-not-a-real-key' }, configurable: true });
  t.after(() => Object.defineProperty(process, 'env', environment));
  let tokens = 0;
  const decide = createJevClient({ onUsage: usage => { tokens = usage.input_tokens; }, fetch: async (url, init) => {
    assert.equal(url, 'https://jevhub.store/api/v1/decide');
    assert.deepEqual(JSON.parse(String(init?.body)), request);
    return Response.json(result());
  } });
  const response = await decide(request);
  assert.equal(planTicket(response, policy).queue, 'billing');
  assert.equal(tokens, 180);
});

test('documented policy routes uncertainty to review and never authorizes refunds', () => {
  assert.equal(planTicket(result(), { ...policy, validated: false }).reason, 'policy_not_validated');
  assert.equal(planTicket(result('other'), policy).reason, 'unclear_department');
  assert.equal(planTicket(result('billing', 0.79), policy).action, 'review');
  assert.equal(planTicket(result('billing', 0.8), policy).action, 'suggest_queue');
  assert.equal(planTicket(result('billing', 1, 0.8), policy).reason, 'refund_request');
  assert.equal(planTicket(result('billing', 1, 1), policy).action, 'review');
  assert.equal(planTicket(result('billing', 1, 0.21), policy).reason, 'unclear_refund_intent');
  assert.equal(planTicket(result('billing', 1, 0.2), policy).action, 'suggest_queue');
  assert.equal(planTicket(result('technical', 1, 0.1, 2, 0.69), policy).reason, 'unclear_impact');
  assert.equal(planTicket(result('technical', 1, 0.1, 1.5, 0.7), policy).priority, 'high');
  assert.equal(planTicket(result('technical', 1, 0.1, 1.49), policy).priority, 'normal');
  assert.equal(planTicket(result('billing', 1, 0.1, 2, 0), policy).action, 'suggest_queue');
});
