import type { Locale } from '@/lib/i18n/config';

const chineseTask = `你是负责当前客户项目的编码 Agent。请将托管的 JEVstone Decision API 接入本项目。

先读取本站接入说明：https://jevhub.store/docs/agent.md
再读取服务端参考代码：https://jevhub.store/docs/examples/jev-client.ts
设计或修改业务问题前，必须读取业务设计指南：https://jevhub.store/docs/decision-design.md
先写简短决策设计卡（业务目标、代码规则、语义判断、错误代价），再设计 state/questions、兜底分支和评测样本。按指南区分 mock 代码验证与真实业务效果评测；阈值没有样本依据就不得声称已适合生产。不确定结果交给澄清或复核，高置信度不代替业务授权。
人类阅读指南：https://jevhub.store/docs/quickstart.html
无需安装 Skill 或上游 SDK，无需访问 GitHub。如果资源无法读取，请停止并报告缺失项，不猜测接口。

先检查项目框架、服务端入口和业务需求。如果没有明确判断场景，请先询问。如果当前仓库本身是 JEV Store 网关（包含 /api/v1/decide、LiteLLM relay 或网关计费），停止并确认目标仓库，不让网关调用自身，不改网关架构、鉴权或计费。只有前端/移动端时先确认后端方案。

使用服务端 fetch，固定 POST https://jevhub.store/api/v1/decide，Authorization: Bearer $JEV_API_KEY。请求 JSON 顶层只包含 state 和 questions；不发送 model。禁止直连上游 TypeSafe，不索取上游 API Key。

请让用户自行在项目的服务端 Secret/环境变量中配置 JEV_API_KEY。不要让用户在对话中粘贴真实密钥，不读取或输出真实密钥，不写含真实密钥的 .env 文件或提交仓库。密钥绝不进入浏览器、移动端、截图或日志。Next.js 服务端适配模块添加 import 'server-only'，不要使用公开环境变量前缀。

沿用客户项目技术栈，把参考代码放进服务端目录并接入所需业务。state 提供必要上下文；questions 使用有清楚 instructions/criteria 的 choice、score 或 noul。按问题名称读取 answers 中的结构化结果，记录 usage.input_tokens。业务权限和实际动作仍由代码控制；客户服务端入口应有鉴权、输入校验及限流。

错误处理：400/403不重试；401提示密钥无效或已撤销；402提示账户充值；429/503指数退避并限制次数。参考实现最多3次请求，每次15秒超时，尊重 Retry-After。网络/超时可能已执行，不自动重放。不记录原始请求、Authorization 或错误响应。

先使用 mock fetch 和假测试占位符验证：成功答案、用量记录、缺失密钥、非重试错误、429/503重试上限、超时、响应校验、请求只含state/questions。运行项目相关测试和构建。真实调用仅在用户已自行配置服务端密钥并同意可能产生费用的验证后进行；没有完成就明确说仅模拟验证。

交付：修改文件清单、无真实密钥的调用示例、服务端密钥隔离说明、测试和构建结果、未验证项。保留无关现有改动，不擅自部署。`;
const englishTask = `You are the coding agent for this CUSTOMER application. Integrate the hosted JEVstone Decision API.

First read https://jevhub.store/docs/agent.md and https://jevhub.store/docs/examples/jev-client.ts. Human guide: https://jevhub.store/docs/quickstart.html. Guidance is currently in Chinese; translate as needed. No Skill, upstream SDK installation or GitHub lookup is required. Stop and report unreadable resources rather than guessing.

Inspect the framework, server entry point and requested business behavior. Ask for the decision use case if unclear. If this IS the JEV Store gateway repository (existing /api/v1/decide, relay or gateway billing), stop and confirm the target customer repository; never make the gateway call itself or replace its architecture, authentication or billing. If no server exists, confirm a backend plan first. Preserve unrelated changes.

Before designing or changing business questions, read https://jevhub.store/docs/decision-design.md. Write a short decision design card: business outcome, deterministic rules, semantic judgments and error costs. Define state/questions, fallback paths and evaluation cases. Separate mock code validation from real business evaluation; do not claim production-ready thresholds without labeled evidence. Uncertain results need clarification or review; high confidence never substitutes for authorization.

Use server-side fetch only: POST https://jevhub.store/api/v1/decide, Authorization: Bearer $JEV_API_KEY, Content-Type: application/json. JSON contains only state and questions. Do not send model; the hosted gateway selects it. Never call upstream TypeSafe directly or request an upstream API key.

Never ask the user to paste a live API key into the agent chat. Have them configure JEV_API_KEY in the server-side secret environment. Read it only at runtime; never print it, create a real-key .env file or commit it. Never expose it to browser/mobile bundles, screenshots or logs. Avoid public environment prefixes. In Next.js add import 'server-only' to the server adapter.

Place the reference client in the server directory using the existing toolchain. Define clear state and typed questions (choice, score, noul), instructions and criteria. Consume structured answers by matching question names and record usage.input_tokens. Code owns permissions and actions; protect server routes with authentication, input validation and rate limits. Calibrate thresholds on business examples.

Do not retry 400/403. Treat 401 as invalid/revoked key; prompt for a top-up on 402. Retry only 429/503 with bounded exponential backoff and jitter, at most 3 total attempts and 15 seconds per attempt; respect Retry-After. Do not automatically replay network failures/timeouts: they may have been billed. Never log raw upstream responses or Authorization.

First test using mock fetch and fake placeholders: typed answers, usage, missing credentials, non-retryable errors, retry limits, timeout, malformed responses, and the two-field body. Run relevant tests and the build. Real paid validation requires user-configured server secrets and authorization for possible cost; otherwise explicitly report mock-only validation.

Deliver changed files, a no-real-key example, server-only key isolation, test/build results and remaining limitations. Do not deploy without authorization.`;

export function buildAgentIntegrationTask({ baseUrl, locale }: { baseUrl: string; locale: Locale }) {
  const origin = new URL(baseUrl).origin;
  return (locale === 'zh-CN' ? chineseTask : englishTask).replaceAll('https://jevhub.store', origin);
}
