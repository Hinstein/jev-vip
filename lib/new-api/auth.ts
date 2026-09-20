import type {
  NewApiAuthBundle,
  NewApiLoginSession,
  NewApiUser,
} from './types';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  code?: string;
  data?: T;
};

type AuthResponseData = {
  access_token?: string;
  access_expires_at?: number;
  session?: NewApiLoginSession;
  user?: NewApiUser;
};

function baseUrl() {
  const value = process.env.NEW_API_BASE_URL?.replace(/\/+$/, '');
  if (!value) throw new Error('New API backend is not configured');
  return value;
}

function trustedOrigin() {
  return process.env.BASE_URL || 'http://localhost:3000';
}

function extractRefreshToken(setCookie: string | null) {
  if (!setCookie) return null;
  const match = setCookie.match(/(?:^|,\s*)new_api_refresh=([^;]+)/);
  return match?.[1] || null;
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    return {
      success: false,
      message: text.slice(0, 500),
    };
  }
}

async function authRequest(
  path: string,
  init: RequestInit
): Promise<{ response: Response; payload: ApiEnvelope<AuthResponseData> }> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error('JEV account service is temporarily unavailable');
  }

  const payload = await parseEnvelope<AuthResponseData>(response);
  return { response, payload };
}

function authError(
  response: Response,
  payload: ApiEnvelope<unknown>,
  fallback: string
) {
  if (payload.code === 'AUTH_USER_DISABLED') {
    return new Error('This account is disabled.');
  }
  return new Error(payload.message || `${fallback} (HTTP ${response.status})`);
}

function normalizeAuthBundle(
  response: Response,
  payload: ApiEnvelope<AuthResponseData>
): NewApiAuthBundle {
  const data = payload.data;
  const refreshToken = extractRefreshToken(response.headers.get('set-cookie'));

  if (
    !response.ok ||
    payload.success === false ||
    !data?.access_token ||
    typeof data.access_expires_at !== 'number' ||
    !data.session?.sid ||
    !data.user ||
    !refreshToken
  ) {
    if (response.ok && payload.success !== false && data && !data.access_token) {
      throw new Error(
        'This account requires an additional New API login verification step that the JEV frontend does not expose yet.'
      );
    }
    throw authError(response, payload, 'Unable to create login session');
  }

  return {
    accessToken: data.access_token,
    accessExpiresAt: data.access_expires_at,
    session: data.session,
    user: data.user,
    refreshToken,
  };
}

export async function loginNewApi(username: string, password: string) {
  const { response, payload } = await authRequest('/api/user/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  return normalizeAuthBundle(response, payload);
}

export async function registerNewApi(username: string, password: string) {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/api/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error('JEV account service is temporarily unavailable');
  }

  const payload = await parseEnvelope<unknown>(response);
  if (!response.ok || payload.success === false) {
    throw authError(
      response,
      payload,
      'Unable to create account. Check the New API registration settings.'
    );
  }
}

export async function refreshNewApiAuth(
  refreshToken: string,
  sid?: string,
  userAgent?: string | null
) {
  const headers: Record<string, string> = {
    Cookie: `new_api_refresh=${refreshToken}`,
    Origin: trustedOrigin(),
  };
  if (sid) headers['X-Auth-Session'] = sid;
  if (userAgent) headers['User-Agent'] = userAgent;

  const { response, payload } = await authRequest('/api/user/auth/refresh', {
    method: 'POST',
    headers,
  });

  return normalizeAuthBundle(response, payload);
}

export async function logoutNewApiAuth(input: {
  accessToken?: string;
  refreshToken?: string;
  sid?: string;
}) {
  const headers: Record<string, string> = {
    Origin: trustedOrigin(),
  };
  if (input.accessToken) {
    headers.Authorization = `Bearer ${input.accessToken}`;
  }
  if (input.refreshToken) {
    headers.Cookie = `new_api_refresh=${input.refreshToken}`;
  }
  if (input.sid) {
    headers['X-Auth-Session'] = input.sid;
  }

  try {
    await fetch(`${baseUrl()}/api/user/auth/logout`, {
      method: 'POST',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // Local logout still proceeds if New API is temporarily unavailable.
  }
}
