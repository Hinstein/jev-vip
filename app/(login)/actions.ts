'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
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
import { validatedAction } from '@/lib/auth/middleware';

const signInSchema = z.object({
  username: z.string().trim().min(1).max(255),
  password: z.string().min(8).max(128),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  try {
    const bundle = await loginNewApi(data.username, data.password);
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
    redirect(redirectTo);
  }

  redirect('/dashboard');
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
  try {
    await registerNewApi(data.username, data.password);
    const bundle = await loginNewApi(data.username, data.password);
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
    redirect(redirectTo);
  }

  redirect('/dashboard');
});

export async function signOut() {
  const [session, store] = await Promise.all([getSession(), cookies()]);
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  if (session || refreshToken) {
    await logoutNewApiAuth({
      accessToken: session?.accessToken,
      refreshToken,
      sid: session?.sid,
    });
  }

  await clearSession();
}
