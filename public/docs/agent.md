# JEV Store · 客户 Agent 接入说明 v1

这是客户应用的接入文档，不是 JEV Store 网关的改造任务。无需安装 Skill、上游 SDK，也无需访问 GitHub。参考实现：
https://jevhub.store/docs/examples/jev-client.ts
人类指南：https://jevhub.store/docs/quickstart.html

设计或修改业务问题前，必须读取 [业务设计指南](https://jevhub.store/docs/decision-design.md)。先写简短决策设计卡，确定哪些规则留在代码里、哪些需要语义判断、错误代价和复核路径，再实现业务。该指南包含完整工单案例、检索排序、引用核验／值提取及评测方法；无需安装 Skill。

## 先确定工作边界

检查客户项目的框架、服务端入口和既有测试。只在需要语义判断的业务路径增加调用，保留原有架构、鉴权和计费。
如果当前仓库就是 JEV Store 网关（已有 /api/v1/decide、LiteLLM relay 或网关计费），停止客户接入，向用户确认目标仓库；不要让网关调用自身。
没有明确业务场景时先询问要实现什么判断，不随意改业务。只有前端/移动端时先确认后端方案，不把密钥放到客户端。

## 接口与密钥

- 仅使用服务端 fetch：POST https://jevhub.store/api/v1/decide。
- Authorization: Bearer $JEV_API_KEY；Content-Type: application/json。
- 用户自行在部署平台的服务端 Secret/环境变量中配置 JEV_API_KEY。不要要求在 Agent 对话中粘贴真实值，不读取或打印已有真实密钥，不生成含真实密钥的 .env 文件，不提交密钥。
- 不使用 NEXT_PUBLIC_ / VITE_ 等客户端公开变量，不写浏览器、移动端、截图、日志或仓库。参考代码仅在服务端运行，Next.js 服务端适配模块加 import 'server-only'。
- 请求顶层只包含 state 和 questions。不发送 model；模型选择属于托管网关，不属于客户。禁止直连上游 TypeSafe 或索取上游 Key。
- 不在浏览器直接测试付费接口。本网站文档只有阅读、复制和下载功能。

## 问题设计

state 是字符串、对象或数组，放判断所需的事实与上下文；先移除无关隐私。questions 是非空的命名对象。每个问题包含 type、instructions，以及该类型需要的 criteria。
instructions 可以是字符串、对象或数组。问题名称用于匹配 answers，不代替完整问题说明。

| 类型 | criteria | answers 中同名结果 | 适用 |
| --- | --- | --- | --- |
| choice | 选项名到描述的对象，描述可为字符串/对象/数组/null，最多255项 | type、choice、probabilities、confidence | 从已知选项选一个；提供 other 兜底 |
| score | 2–10个具体等级描述的有序数组 | type、score、probabilities、legend、confidence | 程度；score 范围0至等级数减1，可为小数 |
| noul | 可省略；或 true / false 的描述对象 | type、noul | 是的概率0–1；0.5不是“中等程度”，没有单独confidence |

每题只问一个清楚的判断。同一 state 的独立问题可以合并请求，不能引用同批其他答案。金额计算、权限、执行动作仍由代码决定。概率不是事实保证，阈值须用业务样本验证，不自动执行退款等高风险动作。

## 最小完整调用示例（Node.js 20+，服务端）

将参考实现复制到客户项目的服务端目录，例如 server/jev-client.ts，沿用项目已有 TS 工具链，无需安装 TypeSafe SDK。

```ts
import { createJevClient } from './jev-client';

const decide = createJevClient({
  onUsage: ({ input_tokens }) => console.info('jev_usage', { input_tokens })
});

async function main() {
  const result = await decide({
    state: { message: 'My receipt has the wrong company name. Please correct it.' },
    questions: {
      department: {
        type: 'choice', instructions: 'Which team should handle the message?',
        criteria: { billing: 'Invoices and payments', technical: 'Software failures', other: 'None of these teams' }
      },
      impact: {
        type: 'score', instructions: 'How much does this issue block use of the product?',
        criteria: ['Product remains usable', 'Some functions unavailable; workaround exists', 'Product unusable; no workaround']
      },
      wants_refund: { type: 'noul', instructions: 'Does the customer explicitly request a refund?' }
    }
  });
  // Read named structured results, not free-form text. Do not log private state.
  return {
    team: result.answers.department.choice,
    impact: result.answers.impact.score,
    refundProbability: result.answers.wants_refund.noul
  };
}

// In an actual server route, catch JevError and return a safe application error.
// Do not expose an unauthenticated public proxy: use customer auth, input limits and rate limits.
main().catch(() => { console.error('Decision failed; inspect safe application error handling.'); process.exitCode = 1; });
```

响应示意（模拟，不代表真实模型表现或计费）：

```json
{"answers":{"department":{"type":"choice","choice":"billing","probabilities":{"billing":1,"technical":0,"other":0},"confidence":1},"impact":{"type":"score","score":0,"probabilities":{"0":1,"1":0,"2":0},"legend":{"0":"Product remains usable","1":"Some functions unavailable; workaround exists","2":"Product unusable; no workaround"},"confidence":1},"wants_refund":{"type":"noul","noul":0.02}},"usage":{"input_tokens":180}}
```

记录 usage.input_tokens；这不等于对账单金额或仅按输入计费的承诺。

## 错误与重试

400 请求错误、403 无权限：不重试。401：提示密钥无效或已撤销，在服务端更换。402：提示账户充值。
仅429和503指数退避重试：参考代码最多3次请求（初次+2次重试），500ms、1000ms基础等待加随机抖动，每次15秒超时。尊重 Retry-After，超过10秒时返回 RETRY_LATER，由调用方稍后安排，不无限等待。
其他状态不自动重试。网络断开、超时、响应格式错误不自动重放；服务端可能已经执行或计费，先核对用量。不要承诺自动去重或复用请求ID能返回原结果。
错误日志只记录安全错误码/HTTP状态，不输出原始响应、Authorization 或请求上下文。onUsage 接入可靠的本地指标记录器，避免在其中做可能失败的远程业务操作。

## 完成标准

1. 修改范围仅客户服务端适配、业务接入与测试，无网关内部改造。
2. 先用假的测试占位符与 mock fetch 验证三类结构化答案、input_tokens、400/401/402/403不重试、429/503有限重试、超时与格式错误、安全日志和只发送两个字段。
3. 运行客户项目相关测试和构建，检查前端包无密钥/服务端调用模块。
4. 真实验证需要用户在服务端配置密钥，并同意可能产生费用的测试；未完成时明确写“仅模拟验证”，不宣称线上已成功。不要求用户回传密钥。
5. 交付修改文件清单、无真实密钥的示例、测试/构建结果和限制。
6. 交付决策设计卡、问题类型选择依据、兜底路径和业务样本；代码测试与真实模型效果分开报告。无标注样本/真实调用授权时说明效果未验证，不宣称示例阈值已适合生产。

协议版本：v1。资源应与网关版本一起发布；协议不匹配时报告问题，不自行退回直连上游或添加 model。
