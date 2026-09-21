export type NewApiPermissions = {
  sidebar_settings?: boolean;
  sidebar_modules?: Record<string, unknown>;
  admin_permissions?: string[];
  [key: string]: unknown;
};

export type NewApiUser = {
  id: number;
  username: string;
  display_name: string;
  has_password?: boolean;
  role: number;
  status: number;
  email?: string | null;
  group: string;
  quota: number;
  used_quota: number;
  request_count: number;
  permissions?: NewApiPermissions;
};

export type NewApiLoginSession = {
  sid: string;
  current?: boolean;
  login_method?: string;
  ip?: string;
  user_agent?: string;
  created_at?: number;
  last_active_at?: number;
  expires_at: number;
};

export type NewApiAuthBundle = {
  accessToken: string;
  accessExpiresAt: number;
  session: NewApiLoginSession;
  user: NewApiUser;
  refreshToken: string;
};
