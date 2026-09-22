/** JEV Store customer reference client v1. Node.js 20+ SERVER ONLY.
 * Keep this file outside browser/mobile imports. In Next.js add import 'server-only'.
 * No SDK dependencies. Never log headers, secrets or raw upstream errors.
 */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type Description = string | Json[] | { [key: string]: Json };
export type Question =
  | { type: 'noul'; instructions: Description; criteria?: { true?: Description; false?: Description } }
  | { type: 'choice'; instructions: Description; criteria: Record<string, Description | null> }
  | { type: 'score'; instructions: Description; criteria: Description[] };
export type Answer<Q extends Question> = Q extends { type: 'noul' }
  ? { type: 'noul'; noul: number }
  : Q extends { type: 'choice' }
    ? { type: 'choice'; choice: string; probabilities: Record<string, number>; confidence: number }
    : { type: 'score'; score: number; probabilities: Record<string, number>; legend: Record<string, string>; confidence: number };
export type Result<Q extends Record<string, Question>> = {
  answers: { [K in keyof Q]: Answer<Q[K]> };
  usage: { input_tokens: number };
};

export class JevError extends Error {
  constructor(public readonly code: string, message: string, public readonly status?: number) {
    super(message);
    this.name = 'JevError';
  }
}

const messages: Record<number, string> = {
  400: 'Invalid request. Check state and questions; do not retry.',
  401: 'JEV_API_KEY is invalid or revoked. Replace it in your server secret environment.',
  402: 'Insufficient balance. Top up your JEV Store account.',
  403: 'Access denied. Check permissions; do not retry.',
  429: 'Rate limited. Retry budget exhausted.',
  503: 'Service unavailable. Retry budget exhausted.'
};
const record = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const probability = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
function invalid(): never {
  throw new JevError('INVALID_RESPONSE', 'Unexpected gateway response; do not act on this result.');
}
function distribution(value: unknown, keys: string[]) {
  if (!record(value) || Object.keys(value).length !== keys.length ||
      !keys.every(k => Object.hasOwn(value, k) && probability(value[k])) ||
      Math.abs(Object.values(value).reduce<number>((sum, n) => sum + Number(n), 0) - 1) > 0.01) invalid();
}
function validate<Q extends Record<string, Question>>(value: unknown, questions: Q): Result<Q> {
  if (!record(value) || !record(value.answers) || !record(value.usage) ||
      !Number.isSafeInteger(value.usage.input_tokens) || Number(value.usage.input_tokens) < 0) invalid();
  for (const [key, question] of Object.entries(questions)) {
    const a = value.answers[key];
    if (!Object.hasOwn(value.answers, key) || !record(a) || a.type !== question.type) invalid();
    if (question.type === 'noul') {
      if (!probability(a.noul)) invalid();
    } else {
      if (!probability(a.confidence)) invalid();
      if (question.type === 'choice') {
        if (typeof a.choice !== 'string' || !Object.hasOwn(question.criteria, a.choice)) invalid();
        distribution(a.probabilities, Object.keys(question.criteria));
      } else {
        const keys = question.criteria.map((_, index) => String(index));
        if (typeof a.score !== 'number' || !Number.isFinite(a.score) ||
            a.score < 0 || a.score > question.criteria.length - 1 || !record(a.legend)) invalid();
        const legend = a.legend;
        if (!keys.every(k => Object.hasOwn(legend, k) && typeof legend[k] === 'string')) invalid();
        distribution(a.probabilities, keys);
      }
    }
  }
  // Return only documented fields; no raw gateway metadata is propagated.
  return { answers: value.answers, usage: { input_tokens: value.usage.input_tokens } } as Result<Q>;
}

/** Injectable transport/timer for offline tests only; production uses native fetch. */
export function createJevClient(options: {
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  onUsage: (usage: { input_tokens: number }) => void;
}) {
  if (typeof window !== 'undefined' || typeof process === 'undefined') {
    throw new JevError('SERVER_ONLY', 'JEV client must run on a Node.js server.');
  }
  const transport = options.fetch ?? globalThis.fetch;
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  return async function decide<Q extends Record<string, Question>>(input: { state: Description; questions: Q }): Promise<Result<Q>> {
    const key = process.env.JEV_API_KEY;
    if (!key?.trim()) throw new JevError('MISSING_KEY', 'Configure JEV_API_KEY in your server secret environment, never in chat.');
    if (!input || (typeof input.state !== 'string' && !record(input.state) && !Array.isArray(input.state)) ||
        !record(input.questions) || Object.keys(input.questions).length === 0) {
      throw new JevError('INVALID_REQUEST', 'Provide state and at least one typed question.');
    }
    // Deliberately whitelist two fields. Never send model or arbitrary caller fields.
    const body = JSON.stringify({ state: input.state, questions: input.questions });
    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      let response: Response;
      let data: unknown;
      try {
        response = await transport('https://jevhub.store/api/v1/decide', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body, signal: controller.signal, redirect: 'error', cache: 'no-store'
        });
        if (response.ok) {
          try { data = await response.json(); }
          catch { invalid(); }
        } else {
          await response.body?.cancel();
        }
      } catch (error) {
        if (error instanceof JevError) throw error;
        // A timed-out request may have been billed. No automatic network replay.
        throw new JevError('NETWORK_ERROR', 'Request failed or timed out. Outcome unknown; check usage before retrying.');
      } finally {
        clearTimeout(timer);
      }
      if (response.ok) {
        const result = validate(data, input.questions);
        // Supply a reliable local metrics sink; it receives token count only.
        options.onUsage(result.usage);
        return result;
      }
      if ((response.status === 429 || response.status === 503) && attempt < 2) {
        const raw = response.headers.get('retry-after');
        const seconds = raw === null ? NaN : Number(raw);
        const retryAfter = Number.isFinite(seconds) ? seconds * 1000 : raw ? Date.parse(raw) - Date.now() : 0;
        // Do not violate long Retry-After headers; return control to the caller.
        if (retryAfter > 10_000) throw new JevError('RETRY_LATER', 'Retry later as requested by gateway.', response.status);
        await sleep(Math.max(500 * 2 ** attempt + Math.random() * 250, retryAfter || 0));
        continue;
      }
      throw new JevError('HTTP_ERROR', messages[response.status] ?? `Gateway HTTP ${response.status}; not retried.`, response.status);
    }
    throw new JevError('RETRY_EXHAUSTED', 'Retry budget exhausted.');
  };
}
