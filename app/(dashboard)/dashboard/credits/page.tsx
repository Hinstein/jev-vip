'use client';

import { WalletCards } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';

export default function CreditsPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <p className="text-sm text-gray-500">Wallet</p>
      <h1 className="text-2xl font-semibold tracking-tight">Credits</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <WalletCards className="h-4 w-4" />
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {new Intl.NumberFormat('en-US').format(user.quota || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Lifetime used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {new Intl.NumberFormat('en-US').format(user.used_quota || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Source of truth</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-gray-600">
          This balance comes directly from the New API user wallet. JEV VIP no
          longer maintains a second local credit balance, so redemption, API
          consumption and admin adjustments cannot drift between two ledgers.
        </CardContent>
      </Card>
    </section>
  );
}
