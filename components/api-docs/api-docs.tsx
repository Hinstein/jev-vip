'use client';

import { useMemo, useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  LockKeyhole,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/components/i18n/use-i18n';
import {
  buildAgentIntegrationTask,
} from '@/lib/jev/agent-task';

type SnippetName = 'curl' | 'node' | 'python';

type ApiDocsProps = {
  baseUrl: string;
};

function requestExample() {
  return JSON.stringify(
    {
      state: 'Customer: I was charged twice and nobody has replied for 3 days.',
      questions: {
        route: {
          type: 'choice',
          instructions: 'Where should this ticket go?',
          criteria: {
            billing: 'payments, refunds, invoices',
            bug: 'the product is broken',
            account: 'login or access',
          },
        },
        urgency: {
          type: 'score',
          instructions: 'How urgent is this message?',
          criteria: ['routine', 'today', 'urgent', 'critical'],
        },
        escalate: {
          type: 'noul',
          instructions: 'Escalate to a human now?',
        },
      },
    },
    null,
    2
  );
}

function responseExample() {
  return JSON.stringify(
    {
      model: 'jev',
      answers: {
        route: {
          type: 'choice',
          choice: 'billing',
          confidence: 0.99,
          probabilities: { billing: 0.99, bug: 0, account: 0.01 },
        },
        urgency: {
          type: 'score',
          score: 3,
          confidence: 1,
          probabilities: { '0': 0, '3': 1 },
        },
        escalate: { type: 'noul', noul: 0.94 },
      },
      usage: { input_tokens: 68, output_tokens: 0 },
    },
    null,
    2
  );
}

function CodeBlock({
  language,
  value,
  copied,
  onCopy,
}: {
  language: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="font-mono text-xs text-gray-400">{language}</span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-7 bg-gray-800 px-2 text-xs text-gray-100 hover:bg-gray-700 hover:text-white"
          onClick={onCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t('common.copied') : t('common.copyToClipboard')}
        </Button>
      </div>
      <pre className="max-h-[32rem] overflow-auto p-4 text-xs leading-6 text-gray-100 sm:text-sm">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export function ApiDocs({ baseUrl }: ApiDocsProps) {
  const { locale, t } = useI18n();
  const [activeSnippet, setActiveSnippet] = useState<SnippetName>('curl');
  const [copied, setCopied] = useState<string | null>(null);
  const endpoint = `${baseUrl}/api/v1/decide`;
  const request = useMemo(requestExample, []);
  const response = useMemo(responseExample, []);
  const agentTask = useMemo(
    () => buildAgentIntegrationTask({ baseUrl, locale }),
    [baseUrl, locale]
  );

  const snippets = useMemo<Record<SnippetName, string>>(
    () => ({
      curl: `export JEV_API_KEY="paste_your_api_key_here"

curl --request POST "${endpoint}" \\
  --header "Authorization: Bearer $JEV_API_KEY" \\
  --header "Content-Type: application/json" \\
  --data '${request}'`,
      node: `const apiKey = process.env.JEV_API_KEY;

if (!apiKey) throw new Error('JEV_API_KEY is not configured');

const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(${request}),
});

const data = await response.json();
if (!response.ok) throw new Error(data.error || 'JEV API request failed');

console.log(data.answers.route.choice);`,
      python: `import os
import requests

response = requests.post(
    '${endpoint}',
    headers={
        'Authorization': f"Bearer {os.environ['JEV_API_KEY']}",
        'Content-Type': 'application/json',
    },
    json=${request},
    timeout=45,
)
response.raise_for_status()

data = response.json()
print(data['answers']['route']['choice'])`,
    }),
    [endpoint, request]
  );

  async function copy(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => {
        setCopied((current) => (current === id ? null : current));
      }, 1800);
    } catch {
      setCopied(null);
    }
  }

  const questionTypes = [
    { name: 'choice', description: t('apiDocs.choiceDescription') },
    { name: 'score', description: t('apiDocs.scoreDescription') },
    { name: 'noul', description: t('apiDocs.noulDescription') },
  ];

  const errors = [
    ['400', t('apiDocs.error400')],
    ['401', t('apiDocs.error401')],
    ['402', t('apiDocs.error402')],
    ['403', t('apiDocs.error403')],
    ['429', t('apiDocs.error429')],
    ['503', t('apiDocs.error503')],
  ];

  return (
    <div className="space-y-8">
      <Card className="rounded-2xl border-gray-200 shadow-none">
        <CardContent className="p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-950 p-2 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('apiDocs.agentEyebrow')}</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                {t('apiDocs.agentTitle')}
              </h2>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">
            {t('apiDocs.agentDescription')}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={() => void copy('agent-task', agentTask)}>
              {copied === 'agent-task' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === 'agent-task' ? t('common.copied') : t('apiDocs.copyAgentTask')}
            </Button>
          </div>
          <p className="mt-4 text-sm">
            <a className="underline underline-offset-4" href="/docs/quickstart.html">
              {locale === 'zh-CN' ? '站内接入指南与参考代码' : 'Hosted integration guide and reference code (Chinese)'}
            </a>
          </p>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer">{locale === 'zh-CN' ? '查看完整任务 / 手动复制' : 'View full task / Copy manually'}</summary>
            <textarea
              aria-label={t('apiDocs.copyAgentTask')}
              readOnly
              value={agentTask}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-3 h-64 w-full rounded-lg border p-3 font-mono text-xs"
            />
          </details>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-200 shadow-none">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2 text-gray-700">
              <LockKeyhole className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold">{t('apiDocs.authentication')}</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-600">
            {t('apiDocs.authenticationDescription')}
          </p>
          <div className="mt-4 rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-900">
            Authorization: Bearer $JEV_API_KEY
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">{t('apiDocs.requestBody')}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-500">
          {t('apiDocs.requestBodyDescription')}
        </p>

        <div className="mt-5 overflow-hidden rounded-xl border">
          <div className="grid grid-cols-[5rem_4rem_minmax(0,1fr)] gap-3 border-b bg-gray-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
            <span>{t('apiDocs.field')}</span>
            <span>{t('apiDocs.required')}</span>
            <span>{t('apiDocs.fieldDescription')}</span>
          </div>
          <div className="grid grid-cols-[5rem_4rem_minmax(0,1fr)] gap-3 border-b px-4 py-4 text-sm">
            <code className="font-medium text-gray-950">state</code>
            <span className="text-gray-600">{t('apiDocs.required')}</span>
            <span className="leading-6 text-gray-600">{t('apiDocs.stateDescription')}</span>
          </div>
          <div className="grid grid-cols-[5rem_4rem_minmax(0,1fr)] gap-3 px-4 py-4 text-sm">
            <code className="font-medium text-gray-950">questions</code>
            <span className="text-gray-600">{t('apiDocs.required')}</span>
            <span className="leading-6 text-gray-600">{t('apiDocs.questionsDescription')}</span>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold">{t('apiDocs.questionTypes')}</h3>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {questionTypes.map((question) => (
              <div key={question.name} className="rounded-xl border bg-white p-4">
                <code className="font-medium text-gray-950">{question.name}</code>
                <p className="mt-2 text-sm leading-6 text-gray-600">{question.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t('apiDocs.exampleRequest')}</h2>
          </div>
          <div className="flex w-full gap-1 rounded-lg bg-gray-100 p-1 sm:w-auto">
            {(['curl', 'node', 'python'] as SnippetName[]).map((name) => (
              <Button
                key={name}
                type="button"
                size="sm"
                variant={activeSnippet === name ? 'secondary' : 'ghost'}
                className="flex-1 sm:flex-none"
                onClick={() => setActiveSnippet(name)}
              >
                {name === 'node' ? 'Node.js' : name === 'curl' ? 'cURL' : 'Python'}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <CodeBlock
            language={activeSnippet === 'node' ? 'JavaScript' : activeSnippet}
            value={snippets[activeSnippet]}
            copied={copied === `snippet-${activeSnippet}`}
            onCopy={() => void copy(`snippet-${activeSnippet}`, snippets[activeSnippet])}
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">{t('apiDocs.exampleResponse')}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-500">
          {t('apiDocs.responseDescription')}
        </p>
        <div className="mt-4">
          <CodeBlock
            language="json"
            value={response}
            copied={copied === 'response'}
            onCopy={() => void copy('response', response)}
          />
        </div>
      </section>

      <Card className="rounded-2xl border-gray-200 shadow-none">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2 text-gray-700">
              <Terminal className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold">{t('apiDocs.errors')}</h2>
          </div>
          <dl className="mt-5 divide-y">
            {errors.map(([status, description]) => (
              <div key={status} className="grid grid-cols-[3.5rem_1fr] gap-3 py-3 text-sm">
                <dt className="font-mono font-medium text-gray-950">{status}</dt>
                <dd className="leading-6 text-gray-600">{description}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
