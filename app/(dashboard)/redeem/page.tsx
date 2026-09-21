import { redirect } from 'next/navigation';
import { getUser } from '@/lib/new-api/user';
import { getI18n } from '@/lib/i18n/server';
import { localizedPath } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export default async function RedeemPage() {
  const { locale } = await getI18n();
  const user = await getUser();
  if (!user) {
    redirect(
      localizedPath(
        locale,
        `/sign-in?redirect=${encodeURIComponent(localizedPath(locale, '/dashboard#redeem'))}`
      )
    );
  }

  redirect(localizedPath(locale, '/dashboard#redeem'));
}
