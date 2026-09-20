import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/db/schema';

type DisplayProduct = Pick<
  Product,
  'id' | 'name' | 'priceMinor' | 'currency' | 'credits' | 'purchaseUrl'
>;

function formatPrice(product: DisplayProduct) {
  if (product.currency === 'CNY') {
    return `¥${(product.priceMinor / 100).toFixed(0)}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency,
  }).format(product.priceMinor / 100);
}

function formatCredits(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export function ProductGrid({ products }: { products: DisplayProduct[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {products.map((product) => (
        <div key={product.id} className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold">{product.name}</h2>
          <p className="mt-4 text-4xl font-semibold">{formatPrice(product)}</p>
          <p className="mt-2 text-sm text-gray-500">
            {formatCredits(product.credits)} JEV Credits
          </p>

          <ul className="mt-6 space-y-3 text-sm text-gray-600">
            <li className="flex gap-2">
              <Check className="h-4 w-4 text-gray-950" />
              One-time voucher redemption
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 text-gray-950" />
              Credits stored in JEV VIP
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 text-gray-950" />
              Full credit ledger
            </li>
          </ul>

          {product.purchaseUrl ? (
            <Button asChild className="mt-6 w-full">
              <a
                href={product.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Buy on Xianyu
              </a>
            </Button>
          ) : (
            <Button className="mt-6 w-full" disabled>
              Xianyu link pending
            </Button>
          )}

          <Button asChild variant="outline" className="mt-2 w-full">
            <Link href="/redeem">I already have a code</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
