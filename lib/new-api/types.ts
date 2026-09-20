export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type NewApiUser = {
  id: number;
  username: string;
  display_name?: string;
  role: number;
  status: number;
  email?: string;
  group: string;
  quota: number;
  used_quota: number;
  request_count: number;
  has_password?: boolean;
};

export type NewApiSession = {
  sid?: string;
  created_at?: number;
  last_seen_at?: number;
  expires_at?: number;
  ip?: string;
  user_agent?: string;
  login_method?: string;
  current?: boolean;
};

export type AuthBundle = {
  access_token: string;
  token_type: string;
  access_expires_at: number;
  session?: NewApiSession;
  user: NewApiUser;
};

export type NewApiToken = {
  id: number;
  user_id: number;
  key: string;
  status: number;
  name: string;
  created_time: number;
  accessed_time: number;
  expired_time: number;
  remain_quota: number;
  unlimited_quota: boolean;
  model_limits_enabled: boolean;
  model_limits: string;
  allow_ips?: string | null;
  used_quota: number;
  group: string;
  cross_group_retry?: boolean;
};

export type PageData<T> = {
  items: T[];
  total: number;
  page?: number;
  page_size?: number;
};

export type NewApiStatus = {
  system_name?: string;
  email_verification?: boolean;
  quota_per_unit?: number;
  display_in_currency?: boolean;
  turnstile_check?: boolean;
  turnstile_site_key?: string;
};
