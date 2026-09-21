'use client';

import { useActionState, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gauge, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocaleLink } from '@/components/i18n/locale-link';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { useI18n } from '@/components/i18n/use-i18n';
import { TurnstileField } from '@/components/auth/turnstile-field';
import type { NewApiAuthStatus } from '@/lib/new-api/auth';
import type { ActionState } from '@/lib/auth/middleware';
import { signIn, signUp } from './actions';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function Login({
  mode = 'signin',
  authStatus,
}: {
  mode?: 'signin' | 'signup';
  authStatus: NewApiAuthStatus;
}) {
  const searchParams = useSearchParams();
  const { locale, t } = useI18n();
  const redirect = searchParams.get('redirect');
  const created = searchParams.get('created') === '1';
  const emailVerificationEnabled =
    mode === 'signup' && authStatus.emailVerificationEnabled;
  const turnstileEnabled = authStatus.turnstileCheckEnabled;
  const turnstileConfigured = Boolean(authStatus.turnstileSiteKey);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );
  const [email, setEmail] = useState(
    typeof state.email === 'string' ? state.email : ''
  );
  const [verificationCode, setVerificationCode] = useState(
    typeof state.verificationCode === 'string' ? state.verificationCode : ''
  );
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (typeof state.email === 'string') setEmail(state.email);
    if (typeof state.verificationCode === 'string') {
      setVerificationCode(state.verificationCode);
    }
  }, [state.email, state.verificationCode]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!state.error || !turnstileEnabled) return;
    setTurnstileToken('');
    setTurnstileResetKey((value) => value + 1);
  }, [state.error, turnstileEnabled]);

  const switchParams = new URLSearchParams();
  if (redirect) switchParams.set('redirect', redirect);
  const switchHref = `${mode === 'signin' ? '/sign-up' : '/sign-in'}${
    switchParams.toString() ? `?${switchParams.toString()}` : ''
  }`;

  function resetTurnstile() {
    setTurnstileToken('');
    setTurnstileResetKey((value) => value + 1);
  }

  async function handleSendVerificationCode() {
    setVerificationMessage('');
    setVerificationError('');

    if (!isValidEmail(email)) {
      setVerificationError(t('login.invalidEmail'));
      return;
    }
    if (turnstileEnabled && !turnstileToken) {
      setVerificationError(t('login.securityCheckError'));
      return;
    }

    setVerificationPending(true);
    try {
      const response = await fetch('/api/auth/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale,
        },
        body: JSON.stringify({
          email: email.trim(),
          turnstile: turnstileToken || undefined,
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || t('login.securityCheckError'));
      }

      setVerificationMessage(t('login.verificationSent'));
      setCooldown(60);
      if (turnstileEnabled) resetTurnstile();
    } catch (error) {
      setVerificationError(
        error instanceof Error ? error.message : t('login.securityCheckError')
      );
      if (turnstileEnabled) resetTurnstile();
    } finally {
      setVerificationPending(false);
    }
  }

  const submitDisabled =
    pending ||
    (turnstileEnabled && (!turnstileConfigured || !turnstileToken));

  return (
    <main className="min-h-[100dvh] bg-[#f7f7f4] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-xl flex-col justify-center">
        <div className="mb-7 flex items-center justify-between">
          <LocaleLink href="/" className="inline-flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gray-950 text-white shadow-sm">
              <Gauge className="size-5" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-[-0.04em] text-gray-950">
                JEV Store
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-gray-400">
                prepaid API
              </span>
            </span>
          </LocaleLink>
          <LocaleSwitcher />
        </div>

        <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-[0_14px_45px_rgba(17,24,39,0.06)] sm:p-9">
          <div>
            <p className="text-sm font-medium text-gray-500">
              {mode === 'signin'
                ? t('login.welcomeBack')
                : t('login.createAccountEyebrow')}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-gray-950 sm:text-[34px]">
              {mode === 'signin' ? t('login.signInTitle') : t('login.signUpTitle')}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
              {t('login.subtitle')}
            </p>
          </div>

          {created ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {t('login.accountCreated')}
            </div>
          ) : null}

          <form className="mt-8 space-y-5" action={formAction}>
            <input type="hidden" name="redirect" value={redirect || ''} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="turnstile" value={turnstileToken} />

            <div>
              <Label htmlFor="email">
                {mode === 'signin' ? t('login.emailOrAccount') : t('login.email')}
              </Label>
              <Input
                id="email"
                name="email"
                type={mode === 'signup' ? 'email' : 'text'}
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setVerificationMessage('');
                  setVerificationError('');
                }}
                required
                maxLength={255}
                className="mt-2 h-12 rounded-xl border-gray-200 bg-white px-4 shadow-none"
                placeholder={mode === 'signin' ? t('login.accountPlaceholder') : t('login.emailPlaceholder')}
              />
            </div>

            {emailVerificationEnabled ? (
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <Label htmlFor="email">{t('login.email')}</Label>
                  <span className="text-xs text-gray-400">
                    {t('login.emailVerificationDescription')}
                  </span>
                </div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setVerificationMessage('');
                      setVerificationError('');
                    }}
                    required
                    maxLength={255}
                    className="h-12 flex-1 rounded-xl border-gray-200 bg-white px-4 shadow-none"
                    placeholder={t('login.emailPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => void handleSendVerificationCode()}
                    disabled={
                      verificationPending ||
                      cooldown > 0 ||
                      !email.trim() ||
                      (turnstileEnabled &&
                        (!turnstileConfigured || !turnstileToken))
                    }
                    className="h-12 shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-32"
                  >
                    {verificationPending
                      ? t('login.sendingCode')
                      : cooldown > 0
                        ? t('login.resendCode', { seconds: cooldown })
                        : t('login.sendCode')}
                  </button>
                </div>
                {verificationMessage ? (
                  <p className="mt-2 text-sm text-emerald-700">
                    {verificationMessage}
                  </p>
                ) : null}
                {verificationError ? (
                  <p className="mt-2 text-sm text-red-600">{verificationError}</p>
                ) : null}
              </div>
            ) : null}

            {emailVerificationEnabled ? (
              <div>
                <Label htmlFor="verificationCode">
                  {t('login.verificationCode')}
                </Label>
                <Input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  required
                  maxLength={32}
                  className="mt-2 h-12 rounded-xl border-gray-200 bg-white px-4 tracking-[0.22em] shadow-none"
                  placeholder={t('login.verificationCodePlaceholder')}
                />
              </div>
            ) : null}

            <div>
              <Label htmlFor="password">{t('login.password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={8}
                maxLength={128}
                className="mt-2 h-12 rounded-xl border-gray-200 bg-white px-4 shadow-none"
                placeholder={t('login.passwordPlaceholder')}
              />
            </div>

            {turnstileEnabled && turnstileConfigured ? (
              <div className="border-t border-gray-100 pt-5">
                <p className="text-sm font-medium text-gray-800">
                  {t('login.securityCheck')}
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-400">
                  {t('login.securityCheckDescription')}
                </p>
                <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <TurnstileField
                    siteKey={authStatus.turnstileSiteKey}
                    errorMessage={t('login.securityCheckError')}
                    onToken={setTurnstileToken}
                    resetKey={turnstileResetKey}
                  />
                </div>
              </div>
            ) : null}

            {turnstileEnabled && !turnstileConfigured ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {t('login.securityCheckError')}
              </div>
            ) : null}

            {state?.error ? (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            ) : null}

            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-sm"
              disabled={submitDisabled}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('login.pleaseWait')}
                </>
              ) : mode === 'signin' ? (
                t('login.signIn')
              ) : (
                t('login.signUp')
              )}
            </Button>
          </form>

          <div className="mt-7 border-t border-gray-100 pt-6 text-center text-sm text-gray-500">
            {mode === 'signin'
              ? t('login.newToJev')
              : t('login.alreadyHaveAccount')}{' '}
            <LocaleLink
              href={switchHref}
              className="font-medium text-gray-950 underline underline-offset-4"
            >
              {mode === 'signin'
                ? t('login.createAccount')
                : t('login.signInInstead')}
            </LocaleLink>
          </div>
        </section>
      </div>
    </main>
  );
}
