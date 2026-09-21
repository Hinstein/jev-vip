type Messages = {
  common: {
    language: string;
    english: string;
    chinese: string;
    loading: string;
    copyToClipboard: string;
    copied: string;
  };
  nav: {
    credits: string;
    dashboard: string;
    signOut: string;
    toggleSidebar: string;
    overview: string;
    redeem: string;
    buyCredits: string;
    apiKeys: string;
    apiDocs: string;
    usage: string;
  };
  home: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    createAccount: string;
    viewCreditPacks: string;
    prepaidCredits: string;
    prepaidCreditsDescription: string;
    apiKeyWorkspace: string;
    apiKeyWorkspaceDescription: string;
    usageVisibility: string;
    usageVisibilityDescription: string;
    simpleFlow: string;
    flowTitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
  login: {
    welcomeBack: string;
    createAccountEyebrow: string;
    signInTitle: string;
    signUpTitle: string;
    subtitle: string;
    email: string;
    verificationCode: string;
    password: string;
    emailPlaceholder: string;
    verificationCodePlaceholder: string;
    passwordPlaceholder: string;
    sendCode: string;
    sendingCode: string;
    resendCode: string;
    verificationSent: string;
    invalidEmail: string;
    emailVerificationDescription: string;
    securityCheck: string;
    securityCheckDescription: string;
    securityCheckError: string;
    emailRegistrationUnavailable: string;
    accountCreated: string;
    pleaseWait: string;
    signIn: string;
    signUp: string;
    newToJev: string;
    alreadyHaveAccount: string;
    createAccount: string;
    signInInstead: string;
  };
  notFound: {
    title: string;
    description: string;
    backHome: string;
  };
  pricing: {
    eyebrow: string;
    title: string;
    description: string;
  };
  topUp: {
    eyebrow: string;
    title: string;
    description: string;
  };
  product: {
    apiBalance: string;
    inputTokens: string;
    outputTokens: string;
    oneTimeRechargeCode: string;
    buyRechargeCode: string;
    purchasePending: string;
    alreadyHaveCode: string;
  };
  redeem: {
    eyebrow: string;
    title: string;
    description: string;
    availableBalance: string;
    redeeming: string;
    redeemNow: string;
    redemptionCode: string;
    placeholder: string;
    voucherNote: string;
    alreadyProcessed: string;
    successful: string;
    networkError: string;
  };
  dashboard: {
    eyebrow: string;
    title: string;
    signedInAs: string;
    availableBalance: string;
    apiSpend: string;
    requests: string;
    activeApiKeys: string;
    redeemCode: string;
    topUp: string;
    quickStart: string;
    callDecisionApi: string;
    quickStartDescription: string;
    manageApiKeys: string;
    viewUsage: string;
    account: string;
    email: string;
    emailNotBound: string;
  };
  credits: {
    eyebrow: string;
    title: string;
    available: string;
    used: string;
    requests: string;
    billedDescription: string;
  };
  usage: {
    eyebrow: string;
    title: string;
    requests: string;
    apiSpend: string;
    remaining: string;
    autoUpdates: string;
    autoUpdatesDescription: string;
  };
  apiKeys: {
    eyebrow: string;
    title: string;
    description: string;
    backendNotConfigured: string;
    keyName: string;
    create: string;
    copyNow: string;
    copyKey: string;
    noKeys: string;
    noKeysDescription: string;
    unnamed: string;
    creationTimeUnavailable: string;
    revoke: string;
    createError: string;
    revokeError: string;
    openDocumentation: string;
  };
  apiDocs: {
    eyebrow: string;
    title: string;
    description: string;
    createKey: string;
    endpoint: string;
    endpointDescription: string;
    endpointNote: string;
    authentication: string;
    authenticationDescription: string;
    requestBody: string;
    requestBodyDescription: string;
    field: string;
    fieldDescription: string;
    required: string;
    stateDescription: string;
    questionsDescription: string;
    questionTypes: string;
    choiceDescription: string;
    scoreDescription: string;
    noulDescription: string;
    exampleRequest: string;
    exampleResponse: string;
    responseDescription: string;
    errors: string;
    error400: string;
    error401: string;
    error402: string;
    error403: string;
    error429: string;
    error503: string;
    security: string;
    securityDescription: string;
    billing: string;
    billingDescription: string;
    manageBalance: string;
  };
};

export const messages: Record<'en' | 'zh-CN', Messages> = {
  en: {
    common: {
      language: 'Language',
      english: 'English',
      chinese: '简体中文',
      loading: 'Loading...',
      copyToClipboard: 'Copy to clipboard',
      copied: 'Copied',
    },
    nav: {
      credits: 'Credits',
      dashboard: 'Dashboard',
      signOut: 'Sign out',
      toggleSidebar: 'Toggle sidebar',
      overview: 'Overview',
      redeem: 'Redeem code',
      buyCredits: 'Top up',
      apiKeys: 'API keys',
      apiDocs: 'API docs',
      usage: 'Usage',
    },
    home: {
      badge: 'Hosted JEVstone API · prepaid access',
      titleLine1: 'JEVstone access without a complicated billing stack.',
      titleLine2: 'Balance, keys and usage in one place.',
      description:
        'Create an account, add prepaid balance, generate an API key and call the JEVstone Decision API. Your balance and usage stay visible in one dashboard.',
      createAccount: 'Create account',
      viewCreditPacks: 'View credit packs',
      prepaidCredits: 'Prepaid balance',
      prepaidCreditsDescription:
        'Recharge first, then use the service from a visible account balance.',
      apiKeyWorkspace: 'API key workspace',
      apiKeyWorkspaceDescription:
        'Create and revoke customer keys without exposing the upstream credential.',
      usageVisibility: 'Usage visibility',
      usageVisibilityDescription:
        'Track requests, token spend and remaining balance without digging through logs.',
      simpleFlow: 'Simple flow',
      flowTitle: 'Buy balance. Create a key. Call JEVstone.',
      step1: 'Sign in to your JEVstone account.',
      step2: 'Redeem a one-time recharge code.',
      step3: 'Generate an API key in the dashboard.',
      step4: 'Send Bearer-authenticated requests to /api/v1/decide.',
    },
    login: {
      welcomeBack: 'Welcome back',
      createAccountEyebrow: 'Create account',
      signInTitle: 'Sign in to JEVstone',
      signUpTitle: 'Start using JEVstone',
      subtitle: 'Use one account for balance, API keys and usage.',
      email: 'Email',
      verificationCode: 'Verification code',
      password: 'Password',
      emailPlaceholder: 'you@example.com',
      verificationCodePlaceholder: '6-digit code',
      passwordPlaceholder: 'At least 8 characters',
      sendCode: 'Send code',
      sendingCode: 'Sending…',
      resendCode: 'Resend in {seconds}s',
      verificationSent: 'A verification code was sent to your email.',
      invalidEmail: 'Please enter a valid email address.',
      emailVerificationDescription:
        'Verify your email before creating the account.',
      securityCheck: 'Quick security check',
      securityCheckDescription:
        'This takes a moment and helps keep sign-in traffic safe.',
      securityCheckError: 'The security check could not load. Please refresh and try again.',
      emailRegistrationUnavailable:
        'Email registration is not available yet. Please try again later.',
      accountCreated: 'Account created. Sign in to continue.',
      pleaseWait: 'Please wait',
      signIn: 'Sign in',
      signUp: 'Create account',
      newToJev: 'New to JEVstone?',
      alreadyHaveAccount: 'Already have an account?',
      createAccount: 'Create account',
      signInInstead: 'Sign in',
    },
    notFound: {
      title: 'Page not found',
      description:
        'The page you are looking for might have been removed, renamed or is temporarily unavailable.',
      backHome: 'Back to home',
    },
    pricing: {
      eyebrow: 'Prepaid API balance',
      title: 'Choose a JEVstone recharge pack',
      description:
        'Buy a recharge code through the listed sales channel, then redeem it to your account. The balance is available immediately after a successful redemption.',
    },
    topUp: {
      eyebrow: 'Top up',
      title: 'Buy JEVstone API balance',
      description:
        'Choose a pack, complete the purchase in the configured sales channel, then redeem the delivered code on this site.',
    },
    product: {
      apiBalance: 'API balance',
      inputTokens: 'per 1M input tokens',
      outputTokens: 'Output: ${value} per 1M output tokens',
      oneTimeRechargeCode: 'One-time recharge code',
      buyRechargeCode: 'Buy recharge code',
      purchasePending: 'Purchase link pending',
      alreadyHaveCode: 'I already have a code',
    },
    redeem: {
      eyebrow: 'Top up',
      title: 'Redeem a code',
      description:
        'Enter the one-time code you received after purchase. API balance is added to this account immediately after a successful redemption.',
      availableBalance: 'Available balance',
      redeeming: 'Redeeming...',
      redeemNow: 'Redeem now',
      redemptionCode: 'Redemption code',
      placeholder: 'JEV10-X82K-PQ91',
      voucherNote:
        'Each recharge code can be credited once according to its backend redemption state.',
      alreadyProcessed:
        'This code was already processed for your account. Current balance: {balance}.',
      successful:
        'Recharge successful: +{credited}. Current balance: {balance}.',
      networkError: 'Network error. Please try again.',
    },
    dashboard: {
      eyebrow: 'Hosted JEVstone API',
      title: 'Dashboard',
      signedInAs: 'Signed in as {value}',
      availableBalance: 'Available balance',
      apiSpend: 'API spend',
      requests: 'Requests',
      activeApiKeys: 'Active API keys',
      redeemCode: 'Redeem code',
      topUp: 'Top up',
      quickStart: 'Quick start',
      callDecisionApi: 'Call the JEVstone Decision API',
      quickStartDescription:
        'Create an API key, keep it server-side, then send JEVstone-shaped requests to the hosted endpoint.',
      manageApiKeys: 'Manage API keys',
      viewUsage: 'View usage',
      account: 'Account',
      email: 'Email',
      emailNotBound: 'Email not bound',
    },
    credits: {
      eyebrow: 'Balance',
      title: 'API balance',
      available: 'Available',
      used: 'Used',
      requests: 'Requests',
      billedDescription: 'JEVstone is billed from input tokens. Output tokens are not charged.',
    },
    usage: {
      eyebrow: 'Metering',
      title: 'Usage',
      requests: 'Requests',
      apiSpend: 'API spend',
      remaining: 'Remaining',
      autoUpdates: 'Usage updates automatically',
      autoUpdatesDescription:
        'Each successful request is settled against the input-token count reported by the JEVstone upstream response.',
    },
    apiKeys: {
      eyebrow: 'Access',
      title: 'API keys',
      description:
        'Create a key for your JEVstone API calls and revoke it whenever you need to rotate access.',
      backendNotConfigured: 'The JEVstone backend is not configured on this server yet.',
      keyName: 'Key name',
      create: 'Create API key',
      copyNow: 'Copy this key now. It will not be shown again in this interface.',
      copyKey: 'Copy key',
      noKeys: 'No API keys yet',
      noKeysDescription: 'Create a key to call the JEVstone API.',
      unnamed: 'Unnamed key',
      creationTimeUnavailable: 'Creation time unavailable',
      revoke: 'Revoke',
      createError: 'Unable to create API key.',
      revokeError: 'Unable to revoke API key.',
      openDocumentation: 'View API docs',
    },
    apiDocs: {
      eyebrow: 'Developer guide',
      title: 'Call the JEVstone API',
      description:
        'Use an API key created in this dashboard to call your hosted JEVstone Decision API. The gateway verifies your key and balance before forwarding the request.',
      createKey: 'Manage API keys',
      endpoint: 'Endpoint',
      endpointDescription: 'Send a POST request to this address.',
      endpointNote:
        'Use this JEV Store address only. Do not call the admin console or the upstream provider directly.',
      authentication: 'Authentication',
      authenticationDescription:
        'Pass the API key as a Bearer token. Keep it in a server-side environment variable and never expose it in browser code.',
      requestBody: 'Request body',
      requestBodyDescription:
        'Send a JSON object with the context to evaluate and one or more typed questions.',
      field: 'Field',
      fieldDescription: 'Description',
      required: 'Required',
      stateDescription:
        'The context to evaluate. It can be a string, object, or array.',
      questionsDescription:
        'A map of question names to typed questions. Add multiple questions to share the same context in one request.',
      questionTypes: 'Question types',
      choiceDescription:
        'Choose one labelled option. Provide a criteria object whose keys are the possible choices.',
      scoreDescription:
        'Rate on an ordered scale. Provide a criteria array with 2–10 descriptions from low to high.',
      noulDescription:
        'Return a calibrated yes/no result. Provide instructions; criteria is optional.',
      exampleRequest: 'Copy an example',
      exampleResponse: 'Response',
      responseDescription:
        'Answers use the names you supplied in questions. Usage is recorded on this account after a successful request.',
      errors: 'Common errors',
      error400: 'The request JSON, state, or questions are invalid.',
      error401: 'The API key is missing, invalid, or has been revoked.',
      error402: 'The account does not have enough API balance. Top up and retry.',
      error403: 'The key or account does not have access to this model.',
      error429: 'The API quota or rate limit was reached. Retry with backoff.',
      error503: 'The gateway or upstream is temporarily unavailable. Retry with backoff.',
      security: 'Keep your key safe',
      securityDescription:
        'Do not put an API key in frontend JavaScript, a mobile app bundle, screenshots, or a public repository. Revoke it immediately here if it is exposed.',
      billing: 'Balance and usage',
      billingDescription:
        'Successful calls consume this account’s prepaid balance based on input tokens. Check the Balance and Usage pages after a call.',
      manageBalance: 'View balance and usage',
    },
  },
  'zh-CN': {
    common: {
      language: '语言',
      english: 'English',
      chinese: '简体中文',
      loading: '加载中…',
      copyToClipboard: '复制到剪贴板',
      copied: '已复制',
    },
    nav: {
      credits: '余额',
      dashboard: '控制台',
      signOut: '退出登录',
      toggleSidebar: '展开或收起侧边栏',
      overview: '概览',
      redeem: '兑换码',
      buyCredits: '充值',
      apiKeys: 'API 密钥',
      apiDocs: 'API 文档',
      usage: '用量',
    },
    home: {
      badge: '托管 JEVstone API · 预付费访问',
      titleLine1: '无需复杂的计费系统，即可使用 JEVstone。',
      titleLine2: '余额、密钥和用量统一管理。',
      description:
        '创建账户、充值余额、生成 API 密钥并调用 JEVstone Decision API，余额和用量都在一个控制台中清晰可见。',
      createAccount: '创建账户',
      viewCreditPacks: '查看充值套餐',
      prepaidCredits: '预付费余额',
      prepaidCreditsDescription: '先充值，再从可见账户余额中使用服务。',
      apiKeyWorkspace: 'API 密钥工作区',
      apiKeyWorkspaceDescription: '创建和撤销客户密钥，不暴露上游凭据。',
      usageVisibility: '用量可见',
      usageVisibilityDescription: '无需翻查日志，即可查看请求、Token 消耗和剩余余额。',
      simpleFlow: '使用流程',
      flowTitle: '充值余额，创建密钥，调用 JEVstone。',
      step1: '登录 JEVstone 账户。',
      step2: '兑换一次性充值码。',
      step3: '在控制台生成 API 密钥。',
      step4: '向 /api/v1/decide 发送 Bearer 鉴权请求。',
    },
    login: {
      welcomeBack: '欢迎回来',
      createAccountEyebrow: '创建账户',
      signInTitle: '登录 JEVstone',
      signUpTitle: '开始使用 JEVstone',
      subtitle: '使用一个账户管理余额、API 密钥和用量。',
      email: '邮箱',
      verificationCode: '邮箱验证码',
      password: '密码',
      emailPlaceholder: 'you@example.com',
      verificationCodePlaceholder: '输入 6 位验证码',
      passwordPlaceholder: '至少 8 个字符',
      sendCode: '发送验证码',
      sendingCode: '发送中…',
      resendCode: '{seconds} 秒后重发',
      verificationSent: '验证码已发送到你的邮箱。',
      invalidEmail: '请输入有效的邮箱地址。',
      emailVerificationDescription: '验证邮箱后即可创建账户。',
      securityCheck: '快速安全验证',
      securityCheckDescription: '验证只需片刻，用于保护登录和注册请求。',
      securityCheckError: '安全验证加载失败，请刷新页面后重试。',
      emailRegistrationUnavailable: '邮箱注册尚未启用，请稍后再试。',
      accountCreated: '账户已创建，请登录继续。',
      pleaseWait: '请稍候',
      signIn: '登录',
      signUp: '创建账户',
      newToJev: '还没有 JEVstone 账户？',
      alreadyHaveAccount: '已经有账户了？',
      createAccount: '创建账户',
      signInInstead: '登录',
    },
    notFound: {
      title: '页面不存在',
      description: '你访问的页面可能已被删除、改名，或暂时不可用。',
      backHome: '返回首页',
    },
    pricing: {
      eyebrow: '预付费 API 余额',
      title: '选择 JEVstone 充值套餐',
      description:
        '通过列出的销售渠道购买充值码，再兑换到你的账户。兑换成功后余额会立即到账。',
    },
    topUp: {
      eyebrow: '充值',
      title: '购买 JEVstone API 余额',
      description: '选择套餐，在配置的销售渠道完成购买，然后在本站兑换收到的兑换码。',
    },
    product: {
      apiBalance: 'API 余额',
      inputTokens: '每 100 万输入 Token',
      outputTokens: '输出：每 100 万 Token ${value}',
      oneTimeRechargeCode: '一次性充值码',
      buyRechargeCode: '购买充值码',
      purchasePending: '购买链接待配置',
      alreadyHaveCode: '我已有兑换码',
    },
    redeem: {
      eyebrow: '充值',
      title: '兑换充值码',
      description: '输入购买后收到的一次性充值码。兑换成功后，API 余额会立即添加到当前账户。',
      availableBalance: '可用余额',
      redeeming: '兑换中…',
      redeemNow: '立即兑换',
      redemptionCode: '兑换码',
      placeholder: 'JEV10-X82K-PQ91',
      voucherNote: '每个充值码只能根据后端兑换状态到账一次。',
      alreadyProcessed: '此兑换码已经为你的账户处理过。当前余额：{balance}。',
      successful: '充值成功：+{credited}。当前余额：{balance}。',
      networkError: '网络错误，请重试。',
    },
    dashboard: {
      eyebrow: '托管 JEVstone API',
      title: '控制台',
      signedInAs: '当前账户：{value}',
      availableBalance: '可用余额',
      apiSpend: 'API 消耗',
      requests: '请求数',
      activeApiKeys: '有效 API 密钥',
      redeemCode: '兑换码',
      topUp: '充值',
      quickStart: '快速开始',
      callDecisionApi: '调用 JEVstone Decision API',
      quickStartDescription: '创建 API 密钥并妥善保存在服务端，然后向托管端点发送 JEVstone 格式请求。',
      manageApiKeys: '管理 API 密钥',
      viewUsage: '查看用量',
      account: '账户',
      email: '邮箱',
      emailNotBound: '未绑定邮箱',
    },
    credits: {
      eyebrow: '余额',
      title: 'API 余额',
      available: '可用',
      used: '已使用',
      requests: '请求数',
      billedDescription: 'JEVstone 按输入 Token 计费，输出 Token 不收费。',
    },
    usage: {
      eyebrow: '用量计量',
      title: '用量',
      requests: '请求数',
      apiSpend: 'API 消耗',
      remaining: '剩余余额',
      autoUpdates: '用量自动更新',
      autoUpdatesDescription: '每次成功请求都会根据 JEVstone 上游响应报告的输入 Token 数量结算。',
    },
    apiKeys: {
      eyebrow: '访问权限',
      title: 'API 密钥',
      description: '创建用于调用 JEVstone API 的密钥，需要轮换访问权限时可以随时撤销。',
      backendNotConfigured: '服务器尚未配置 JEVstone 后端。',
      keyName: '密钥名称',
      create: '创建 API 密钥',
      copyNow: '请立即复制此密钥，之后不会在此界面再次显示。',
      copyKey: '复制密钥',
      noKeys: '暂无 API 密钥',
      noKeysDescription: '创建密钥后即可调用 JEVstone API。',
      unnamed: '未命名密钥',
      creationTimeUnavailable: '创建时间不可用',
      revoke: '撤销',
      createError: '无法创建 API 密钥。',
      revokeError: '无法撤销 API 密钥。',
      openDocumentation: '查看 API 文档',
    },
    apiDocs: {
      eyebrow: '开发者文档',
      title: '调用 JEVstone API',
      description:
        '使用在本控制台创建的 API 密钥调用托管的 JEVstone Decision API。网关会先校验密钥和账户余额，再转发请求。',
      createKey: '管理 API 密钥',
      endpoint: '接口地址',
      endpointDescription: '向以下地址发送 POST 请求。',
      endpointNote:
        '只能调用这个 JEV Store 地址；不要调用管理后台地址，也不要直接调用上游服务商。',
      authentication: '鉴权方式',
      authenticationDescription:
        '将 API 密钥作为 Bearer Token 传入。请只保存在服务端环境变量中，绝不要暴露在浏览器代码里。',
      requestBody: '请求体',
      requestBodyDescription:
        '发送一个 JSON 对象，包含待判断的上下文和一个或多个带类型的问题。',
      field: '字段',
      fieldDescription: '说明',
      required: '必填',
      stateDescription: '待判断的上下文，可以是字符串、对象或数组。',
      questionsDescription:
        '问题名称到带类型问题的映射。一次请求可添加多个问题，它们会复用同一份上下文。',
      questionTypes: '问题类型',
      choiceDescription:
        '从多个带标签的选项中选择一个。传入 criteria 对象，键名就是可选结果。',
      scoreDescription:
        '按有序刻度评分。传入含 2–10 个描述的 criteria 数组，顺序从低到高。',
      noulDescription:
        '返回经过校准的是/否结果。传入 instructions；criteria 为可选项。',
      exampleRequest: '复制示例',
      exampleResponse: '响应结果',
      responseDescription:
        'answers 使用你在 questions 中提供的名称作为键。请求成功后，用量会记入当前账户。',
      errors: '常见错误',
      error400: '请求 JSON、state 或 questions 格式不正确。',
      error401: '缺少 API 密钥、密钥无效，或该密钥已被撤销。',
      error402: '账户 API 余额不足。充值后重试。',
      error403: '该密钥或账户无权访问此模型。',
      error429: '已达到 API 配额或限流，请使用退避策略后重试。',
      error503: '网关或上游服务暂时不可用，请使用退避策略后重试。',
      security: '妥善保管密钥',
      securityDescription:
        '不要将 API 密钥写进前端 JavaScript、移动端安装包、截图或公开仓库。如果密钥泄露，请立即在此控制台撤销。',
      billing: '余额与用量',
      billingDescription:
        '成功调用会按输入 Token 从当前账户的预付费余额中扣除。调用后可在“余额”和“用量”页面查看结果。',
      manageBalance: '查看余额与用量',
    },
  },
};

export type MessageKey = {
  [Section in keyof Messages]: `${Section & string}.${keyof Messages[Section] & string}`;
}[keyof Messages];

export function translate(
  locale: 'en' | 'zh-CN',
  key: MessageKey,
  values: Record<string, string | number> = {}
) {
  const [section, messageKey] = key.split('.') as [keyof Messages, string];
  const message = messages[locale][section][messageKey as never] as string;

  return message.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(values[name] ?? `{${name}}`)
  );
}
