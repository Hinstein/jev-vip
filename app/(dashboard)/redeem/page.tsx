import { redirect } from 'next/navigation';
import { getI18n } from '@/lib/i18n/server';
import { localizedPath } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export default async function RedeemPage() {
  const { locale } = await getI18n();
  redirect(localizedPath(locale, '/dashboard/redeem'));
}
