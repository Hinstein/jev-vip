'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import {
  loginNewApi,
  logoutNewApiAuth,
  registerNewApi,
} from '@/lib/new-api/auth';
import {
  clearSession,
  getSession,
  REFRESH_COOKIE,
  setSession,
} from '@/lib/auth/session';
import { forwardedForFromHeaders } from '@/lib/http/client-ip';
import { validatedAction } from '@/lib/auth/middleware';
import { getLocale } from '@/lib/i18n/server';
import { isLocale, localizedPath, type Locale } from '@/lib/i18n/config';

const signInSchema = z.object({
  username: z.string().trim().min(1).max(255),
  password: z.string().min(8).max(128),
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
      data.username,
      data.password,
      await requestMeta()
    );
    await setSession(bundle);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please try again.',
      username: data.username,
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
  username: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Use letters, numbers, ., _ or - only.'),
  password: z.string().min(8).max(128),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const locale = await actionLocale(formData);
  try {
    const meta = await requestMeta();
    await registerNewApi(data.username, data.password, meta);
    const bundle = await loginNewApi(data.username, data.password, meta);
    await setSession(bundle);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Unable to create account. Please try again.',
      username: data.username,
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

export async function signOut() {
  const [session, store, meta] = await Promise.all([
    getSession(),
    cookies(),
    requestMeta(),
  ]);
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  if (session || refreshToken) {
    await logoutNewApiAuth({
      accessToken: session?.accessToken,
      refreshToken,
      sid: session?.sid,
      ...meta,
    });
  }

  await clearSession();
}
