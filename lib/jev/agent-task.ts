import type { Locale } from '@/lib/i18n/config';

export const typeSafeSkillUrl =
  'https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md';
export const typeSafeSkillRawUrl =
  'https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md';

export const typeSafeInstallCommands = {
  claudeCode:
    'claude plugin marketplace add typesafe-ai/skills\nclaude plugin install typesafe@typesafe-ai',
  otherAgents: 'npx skills add typesafe-ai/skills --skill typesafe-ai',
};

type AgentTaskInput = {
  baseUrl: string;
  locale: Locale;
};

export function buildAgentIntegrationTask({
  baseUrl,
  locale,
}: AgentTaskInput) {
  const endpoint = `${baseUrl}/api/v1/decide`;

  if (locale === 'zh-CN') {
    return `你是负责当前项目的编码 Agent。请把托管的 JEVstone Decision API 接入本项目。

第一步：安装并阅读 TypeSafe 官方 skill；只能选择以下一种安装方式，不能两种都执行：

如果你是 Claude Code：
${typeSafeInstallCommands.claudeCode}

如果你是其他编码 Agent：
${typeSafeInstallCommands.otherAgents}
按提示选择你当前使用的 Agent。

安装后，先阅读已安装的 TypeSafe skill 与当前 TypeSafe 文档，再开始修改代码。skill 用于学习如何设计 state、choice、score 和 noul 问题；它不是本项目的上游凭据。

如果你的运行环境无法安装 skill，请直接阅读官方 skill：
${typeSafeSkillUrl}
原始 Markdown：${typeSafeSkillRawUrl}

重要边界：本项目必须调用 JEV Store 网关，不能直接调用 https://api.typesafe.ai/v1/systemone，不能索取或使用上游 TypeSafe API Key，也不能把用户 API Key 放进浏览器、移动端、截图或代码仓库。

网关地址：POST ${endpoint}
鉴权方式：Authorization: Bearer $JEV_API_KEY

不要让用户在 Agent 对话中粘贴真实 API Key。请让用户在项目的服务端密钥环境中配置 JEV_API_KEY；运行时读取它但绝不输出、写入真实密钥的 .env 文件或提交到仓库。使用服务端 fetch 调用网关。不要发送 model：JEV Store 网关会为已鉴权请求选择并注入模型。请求 JSON 只包含：
- state：要判断的上下文（字符串、对象或数组）
- questions：一个或多个带类型的问题；可使用 choice、score、noul

处理结果时使用 answers 中与 questions 同名的结构化结果，并记录 usage.input_tokens。错误处理：400 和 403 不重试；401 说明密钥无效或已撤销；402 提示账户充值；429 和 503 使用指数退避重试。

完成后请：
1. 说明修改了哪些文件；
2. 提供不含真实密钥的调用示例；
3. 确认 API Key 始终只在服务端使用；
4. 运行与本次改动相关的测试和构建。`;
  }

  return `You are the coding agent for this project. Integrate the hosted JEVstone Decision API.

First, install and read the official TypeSafe skill. Choose exactly one installation method; do not run both:

If you are Claude Code:
${typeSafeInstallCommands.claudeCode}

If you are another coding agent:
${typeSafeInstallCommands.otherAgents}
Select the current agent when prompted.

After installation, read the installed TypeSafe skill and the current TypeSafe documentation before changing code. Use the skill to learn how to design state, choice, score, and noul questions; it is not an upstream credential for this project.

If your environment cannot install the skill, read the official skill directly:
${typeSafeSkillUrl}
Raw Markdown: ${typeSafeSkillRawUrl}

Important boundary: this project must call the JEV Store gateway. Do not call https://api.typesafe.ai/v1/systemone directly, do not request or use an upstream TypeSafe API key, and do not expose the customer's API key in browser code, mobile bundles, screenshots, or a repository.

Gateway endpoint: POST ${endpoint}
Authentication: Authorization: Bearer $JEV_API_KEY

Never ask the user to paste a live API key into the agent chat. Ask them to configure JEV_API_KEY in the project's server-side secret environment; read it at runtime but never print it, write a real-key .env file, or commit it. Use server-side fetch to call the gateway. Do not send model: the JEV Store gateway selects and injects the model for an authenticated request. The JSON request body contains only:
- state: the context to evaluate (string, object, or array)
- questions: one or more typed questions using choice, score, or noul

Use the structured answer with the matching question name from answers, and record usage.input_tokens. Handle errors as follows: do not retry 400 or 403; treat 401 as an invalid or revoked key; prompt for a top-up on 402; retry 429 and 503 with exponential backoff.

When finished:
1. Explain which files changed.
2. Provide a request example with no real key.
3. Confirm the API key is only used server-side.
4. Run the tests and build relevant to the change.`;
}
