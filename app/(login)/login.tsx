'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Gauge, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/auth-provider';
import type { ApiEnvelope, NewApiStatus } from '@/lib/new-api/types';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [emailVerification, setEmailVerification] = useState(false);
  const [pending, setPending] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeMessage, setCodeMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'signup') return;
    fetch('/api/status', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: ApiEnvelope<NewApiStatus>) => {
        setEmailVerification(Boolean(payload.data?.email_verification));
      })
      .catch(() => undefined);
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);
    try {
      if (mode === 'signin') {
        await login(username.trim(), password);
      } else {
        await register({
          username: username.trim(),
          password,
          email: email.trim(),
          verificationCode: verificationCode.trim(),
        });
      }

      const redirect = searchParams.get('redirect');
      router.replace(
        redirect && redirect.startsWith('/') && !redirect.startsWith('//')
          ? redirect
          : '/dashboard'
      );
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed.');
    } finally {
      setPending(false);
    }
  }

  async function sendCode() {
    if (!email || sendingCode) return;
    setSendingCode(true);
    setCodeMessage(null);
    setError(null);
    try {
      const response = await fetch(
        `/api/verification?email=${encodeURIComponent(email.trim())}`,
        { cache: 'no-store' }
      );
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to send verification code.');
      }
      setCodeMessage('Verification code sent.');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to send verification code.'
      );
    } finally {
      setSendingCode(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-950 text-white">
            <Gauge className="h-6 w-6" />
          </span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'signin' ? 'Sign in to JEV VIP' : 'Create your JEV VIP account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Account, balance and API access are backed by New API.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-5" onSubmit={submit}>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              minLength={1}
              maxLength={20}
              autoComplete="username"
              className="mt-1 rounded-full"
              placeholder="Your username"
            />
          </div>

          {mode === 'signup' && emailVerification ? (
            <>
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    required
                    maxLength={50}
                    autoComplete="email"
                    className="rounded-full"
                    placeholder="you@example.com"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    disabled={!email || sendingCode}
                    onClick={sendCode}
                  >
                    {sendingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  </Button>
                </div>
                {codeMessage ? (
                  <p className="mt-1 text-xs text-green-700">{codeMessage}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="verification-code">Verification code</Label>
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  required
                  className="mt-1 rounded-full"
                  placeholder="Email code"
                />
              </div>
            </>
          ) : null}

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              maxLength={128}
              className="mt-1 rounded-full"
              placeholder="At least 8 characters"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" className="w-full rounded-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === 'signin' ? 'Sign in' : 'Sign up'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
          <Link
            href={mode === 'signin' ? '/sign-up' : '/sign-in'}
            className="font-medium text-gray-950 hover:underline"
          >
            {mode === 'signin' ? 'Create an account' : 'Sign in'}
          </Link>
        </div>
      </div>
    </div>
  );
}
