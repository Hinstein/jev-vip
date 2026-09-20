import { redirect } from 'next/navigation';
import { WalletCards } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getUser } from '@/lib/db/queries';
import {
  getCreditBalance,
  getCreditTransactions,
} from '@/lib/credits/queries';

export const dynamic = 'force-dynamic';

function formatCredits(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default async function CreditsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const [balance, transactions] = await Promise.all([
    getCreditBalance(user.id),
    getCreditTransactions(user.id),
  ]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <p className="text-sm text-gray-500">Ledger</p>
      <h1 className="text-2xl font-semibold tracking-tight">Credits</h1>

      <Card className="mt-6 max-w-md">
        <CardContent className="pt-6">
          <WalletCards className="h-5 w-5 text-gray-500" />
          <p className="mt-3 text-sm text-gray-500">Available balance</p>
          <p className="mt-1 text-3xl font-semibold">{formatCredits(balance)}</p>
          <p className="text-sm text-gray-500">JEV Credits</p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Credit transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No credit transactions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-gray-500">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Time</th>
                    <th className="py-3 pr-4 font-medium">Type</th>
                    <th className="py-3 pr-4 font-medium">Product</th>
                    <th className="py-3 pr-4 font-medium">Source</th>
                    <th className="py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 text-gray-500">
                        {transaction.createdAt.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">{transaction.type}</td>
                      <td className="py-3 pr-4">
                        {transaction.productName ?? '—'}
                      </td>
                      <td className="py-3 pr-4">{transaction.source}</td>
                      <td
                        className={`py-3 text-right font-medium ${
                          transaction.amount > 0
                            ? 'text-green-700'
                            : 'text-gray-900'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {formatCredits(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
