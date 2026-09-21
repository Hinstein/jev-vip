type Messages = {
  common: {
    language: string;
    english: string;
    chinese: string;
    loading: string;
    copyToClipboard: string;
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
    usernameOrEmail: string;
    username: string;
    password: string;
    accountPlaceholder: string;
    usernamePlaceholder: string;
    passwordPlaceholder: string;
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
    username: string;
    group: string;
    accountId: string;
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
      usage: 'Usage',
    },
    home: {
      badge: 'Hosted Jev API · prepaid access',
      titleLine1: 'Jev access without a complicated billing stack.',
      titleLine2: 'Balance, keys and usage in one place.',
      description:
        'Create an account, add prepaid balance, generate an API key and call the Jev Decision API. Your balance and usage stay visible in one dashboard.',
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
      flowTitle: 'Buy balance. Create a key. Call Jev.',
      step1: 'Sign in to your Jev account.',
      step2: 'Redeem a one-time recharge code.',
      step3: 'Generate an API key in the dashboard.',
      step4: 'Send Bearer-authenticated requests to /api/v1/decide.',
    },
    login: {
      welcomeBack: 'Welcome back',
      createAccountEyebrow: 'Create account',
      signInTitle: 'Sign in to Jev',
      signUpTitle: 'Start using Jev',
      subtitle: 'Use one account for balance, API keys and usage.',
      usernameOrEmail: 'Username or email',
      username: 'Username',
      password: 'Password',
      accountPlaceholder: 'your account',
      usernamePlaceholder: 'choose a username',
      passwordPlaceholder: 'At least 8 characters',
      pleaseWait: 'Please wait',
      signIn: 'Sign in',
      signUp: 'Create account',
      newToJev: 'New to Jev?',
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
      title: 'Choose a Jev recharge pack',
      description:
        'Buy a recharge code through the listed sales channel, then redeem it to your account. The balance is available immediately after a successful redemption.',
    },
    topUp: {
      eyebrow: 'Top up',
      title: 'Buy Jev API balance',
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
      eyebrow: 'Hosted Jev API',
      title: 'Dashboard',
      signedInAs: 'Signed in as {value}',
      availableBalance: 'Available balance',
      apiSpend: 'API spend',
      requests: 'Requests',
      activeApiKeys: 'Active API keys',
      redeemCode: 'Redeem code',
      topUp: 'Top up',
      quickStart: 'Quick start',
      callDecisionApi: 'Call the Jev Decision API',
      quickStartDescription:
        'Create an API key, keep it server-side, then send Jev-shaped requests to the hosted endpoint.',
      manageApiKeys: 'Manage API keys',
      viewUsage: 'View usage',
      account: 'Account',
      username: 'Username',
      group: 'Group',
      accountId: 'Account ID',
    },
    credits: {
      eyebrow: 'Balance',
      title: 'API balance',
      available: 'Available',
      used: 'Used',
      requests: 'Requests',
      billedDescription: 'Jev is billed from input tokens. Output tokens are not charged.',
    },
    usage: {
      eyebrow: 'Metering',
      title: 'Usage',
      requests: 'Requests',
      apiSpend: 'API spend',
      remaining: 'Remaining',
      autoUpdates: 'Usage updates automatically',
      autoUpdatesDescription:
        'Each successful request is settled against the input-token count reported by the Jev upstream response.',
    },
    apiKeys: {
      eyebrow: 'Access',
      title: 'API keys',
      description:
        'Create a key for your Jev API calls and revoke it whenever you need to rotate access.',
      backendNotConfigured: 'The Jev backend is not configured on this server yet.',
      keyName: 'Key name',
      create: 'Create API key',
      copyNow: 'Copy this key now. It will not be shown again in this interface.',
      copyKey: 'Copy key',
      noKeys: 'No API keys yet',
      noKeysDescription: 'Create a key to call the Jev API.',
      unnamed: 'Unnamed key',
      creationTimeUnavailable: 'Creation time unavailable',
      revoke: 'Revoke',
      createError: 'Unable to create API key.',
      revokeError: 'Unable to revoke API key.',
    },
  },
  'zh-CN': {
    common: {
      language: '语言',
      english: 'English',
      chinese: '简体中文',
      loading: '加载中…',
      copyToClipboard: '复制到剪贴板',
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
      usage: '用量',
    },
    home: {
      badge: '托管 Jev API · 预付费访问',
      titleLine1: '无需复杂的计费系统，即可使用 Jev。',
      titleLine2: '余额、密钥和用量统一管理。',
      description:
        '创建账户、充值余额、生成 API 密钥并调用 Jev Decision API，余额和用量都在一个控制台中清晰可见。',
      createAccount: '创建账户',
      viewCreditPacks: '查看充值套餐',
      prepaidCredits: '预付费余额',
      prepaidCreditsDescription: '先充值，再从可见账户余额中使用服务。',
      apiKeyWorkspace: 'API 密钥工作区',
      apiKeyWorkspaceDescription: '创建和撤销客户密钥，不暴露上游凭据。',
      usageVisibility: '用量可见',
      usageVisibilityDescription: '无需翻查日志，即可查看请求、Token 消耗和剩余余额。',
      simpleFlow: '使用流程',
      flowTitle: '充值余额，创建密钥，调用 Jev。',
      step1: '登录 Jev 账户。',
      step2: '兑换一次性充值码。',
      step3: '在控制台生成 API 密钥。',
      step4: '向 /api/v1/decide 发送 Bearer 鉴权请求。',
    },
    login: {
      welcomeBack: '欢迎回来',
      createAccountEyebrow: '创建账户',
      signInTitle: '登录 Jev',
      signUpTitle: '开始使用 Jev',
      subtitle: '使用一个账户管理余额、API 密钥和用量。',
      usernameOrEmail: '用户名或邮箱',
      username: '用户名',
      password: '密码',
      accountPlaceholder: '输入账户名',
      usernamePlaceholder: '选择用户名',
      passwordPlaceholder: '至少 8 个字符',
      pleaseWait: '请稍候',
      signIn: '登录',
      signUp: '创建账户',
      newToJev: '还没有 Jev 账户？',
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
      title: '选择 Jev 充值套餐',
      description:
        '通过列出的销售渠道购买充值码，再兑换到你的账户。兑换成功后余额会立即到账。',
    },
    topUp: {
      eyebrow: '充值',
      title: '购买 Jev API 余额',
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
      eyebrow: '托管 Jev API',
      title: '控制台',
      signedInAs: '当前账户：{value}',
      availableBalance: '可用余额',
      apiSpend: 'API 消耗',
      requests: '请求数',
      activeApiKeys: '有效 API 密钥',
      redeemCode: '兑换码',
      topUp: '充值',
      quickStart: '快速开始',
      callDecisionApi: '调用 Jev Decision API',
      quickStartDescription: '创建 API 密钥并妥善保存在服务端，然后向托管端点发送 Jev 格式请求。',
      manageApiKeys: '管理 API 密钥',
      viewUsage: '查看用量',
      account: '账户',
      username: '用户名',
      group: '用户组',
      accountId: '账户 ID',
    },
    credits: {
      eyebrow: '余额',
      title: 'API 余额',
      available: '可用',
      used: '已使用',
      requests: '请求数',
      billedDescription: 'Jev 按输入 Token 计费，输出 Token 不收费。',
    },
    usage: {
      eyebrow: '用量计量',
      title: '用量',
      requests: '请求数',
      apiSpend: 'API 消耗',
      remaining: '剩余余额',
      autoUpdates: '用量自动更新',
      autoUpdatesDescription: '每次成功请求都会根据 Jev 上游响应报告的输入 Token 数量结算。',
    },
    apiKeys: {
      eyebrow: '访问权限',
      title: 'API 密钥',
      description: '创建用于调用 Jev API 的密钥，需要轮换访问权限时可以随时撤销。',
      backendNotConfigured: '服务器尚未配置 Jev 后端。',
      keyName: '密钥名称',
      create: '创建 API 密钥',
      copyNow: '请立即复制此密钥，之后不会在此界面再次显示。',
      copyKey: '复制密钥',
      noKeys: '暂无 API 密钥',
      noKeysDescription: '创建密钥后即可调用 Jev API。',
      unnamed: '未命名密钥',
      creationTimeUnavailable: '创建时间不可用',
      revoke: '撤销',
      createError: '无法创建 API 密钥。',
      revokeError: '无法撤销 API 密钥。',
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
