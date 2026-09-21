'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import {
  getNewApiAuthStatus,
  loginNewApi,
  logoutNewApiAuth,
  registerNewApi,
} from '@/lib/new-api/auth';
import {
  clearStoredNewApiAuthCookies,
  getNewApiCredentials,
  storeNewApiAuthCookies,
} from '@/lib/auth/new-api-session';
import { forwardedForFromHeaders } from '@/lib/http/client-ip';
import { validatedAction } from '@/lib/auth/middleware';
import { newApiUsernameForLogin, usernameForEmail } from '@/lib/auth/account-identity';
import { getLocale } from '@/lib/i18n/server';
import { isLocale, localizedPath, type Locale } from '@/lib/i18n/config';
import { translate } from '@/lib/i18n/messages';

const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  turnstile: z.string().trim().max(4096).optional(),
});

async function requestMeta() {
  const requestHeaders = await headers();
  return {
    forwardedFor: forwardedForFromHeaders(requestHeaders),
    userAgent: requestHeaders.get('user-agent'),
  };
}

async function actionLocale(formData: FormData): Promise<Locale> {
  const submitted = formData.get('locale');
  if (typeof submitted === 'string' && isLocale(submitted)) {
    return submitted;
  }
  return getLocale();
}

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const locale = await actionLocale(formData);
  try {
    const bundle = await loginNewApi(
      newApiUsernameForLogin(data.email),
      data.password,
      await requestMeta(),
      { turnstile: data.turnstile || undefined }
    );
    await storeNewApiAuthCookies(bundle);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please try again.',
      email: data.email,
    };
  }

  const redirectTo = formData.get('redirect');
  if (
    typeof redirectTo === 'string' &&
    redirectTo.startsWith('/') &&
    !redirectTo.startsWith('//')
  ) {
    redirect(localizedPath(locale, redirectTo));
  }

  redirect(localizedPath(locale, '/dashboard'));
});

const signUpSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128),
  verificationCode: z
    .union([z.literal(''), z.string().trim().max(32)])
    .optional(),
  turnstile: z.string().trim().max(4096).optional(),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const locale = await actionLocale(formData);
  let requiresSignIn = false;
  const authStatus = await getNewApiAuthStatus();
  if (!authStatus.emailVerificationEnabled) {
    return {
      error: translate(locale, 'login.emailRegistrationUnavailable'),
      email: data.email,
      verificationCode: data.verificationCode,
    };
  }
  const username = usernameForEmail(data.email);
  try {
    const meta = await requestMeta();
    await registerNewApi(username, data.password, meta, {
      email: data.email,
      verificationCode: data.verificationCode || undefined,
      turnstile: data.turnstile || undefined,
    });

    // Turnstile tokens are single-use. New API also protects the login route,
    // so a token used for registration cannot safely be reused for the
    // automatic login that follows it.
    requiresSignIn = Boolean(data.turnstile);
    if (!requiresSignIn) {
      const bundle = await loginNewApi(username, data.password, meta);
      await storeNewApiAuthCookies(bundle);
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Unable to create account. Please try again.',
      email: data.email,
      verificationCode: data.verificationCode,
    };
  }

  if (requiresSignIn) {
    redirect(localizedPath(locale, '/sign-in?created=1'));
  }

  const redirectTo = formData.get('redirect');
  if (
    typeof redirectTo === 'string' &&
    redirectTo.startsWith('/') &&
    !redirectTo.startsWith('//')
  ) {
    redirect(localizedPath(locale, redirectTo));
  }

  redirect(localizedPath(locale, '/dashboard'));
});

export async function signOut() {
  const [credentials, meta] = await Promise.all([
    getNewApiCredentials(),
    requestMeta(),
  ]);

  if (credentials.accessToken || credentials.refreshToken) {
    await logoutNewApiAuth({
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      sid: credentials.sessionId,
      ...meta,
    });
  }

  await clearStoredNewApiAuthCookies();
}
