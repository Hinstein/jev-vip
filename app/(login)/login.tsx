'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';
import type { ActionState } from '@/lib/auth/middleware';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  return (
    <main className="min-h-[100dvh] bg-[#f7f7f4] px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-md flex-col justify-center">
        <Link href="/" className="mb-10 inline-flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-[-0.04em] text-gray-950">
            Jev
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
            prepaid API
          </span>
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-gray-500">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
            {mode === 'signin' ? 'Sign in to Jev' : 'Start using Jev'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Account authentication, roles and permissions are managed by the
            New API backend.
          </p>

          <form className="mt-8 space-y-5" action={formAction}>
            <input type="hidden" name="redirect" value={redirect || ''} />

            <div>
              <Label htmlFor="username">
                {mode === 'signin' ? 'Username or email' : 'Username'}
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                defaultValue={state.username}
                required
                maxLength={mode === 'signin' ? 255 : 20}
                className="mt-2 h-11"
                placeholder={mode === 'signin' ? 'your account' : 'choose a username'}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={8}
                maxLength={128}
                className="mt-2 h-11"
                placeholder="At least 8 characters"
              />
            </div>

            {state?.error ? (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {state.error}
              </div>
            ) : null}

            <Button type="submit" className="h-11 w-full" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {mode === 'signin' ? 'New to Jev?' : 'Already have an account?'}{' '}
            <Link
              href={mode === 'signin' ? '/sign-up' : '/sign-in'}
              className="font-medium text-gray-950 underline underline-offset-4"
            >
              {mode === 'signin' ? 'Create account' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
