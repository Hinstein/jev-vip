import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/db/schema';
import {
  formatApproxInputTokens,
  formatUsdFromQuota,
} from '@/lib/jev/billing';

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

export function ProductGrid({ products }: { products: DisplayProduct[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {products.map((product) => (
        <div key={product.id} className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold">{product.name}</h2>
          <p className="mt-4 text-4xl font-semibold tracking-tight">
            {formatPrice(product)}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {formatUsdFromQuota(product.credits)} API balance
          </p>
          <p className="mt-1 text-xs text-gray-400">
            ≈ {formatApproxInputTokens(product.credits)} Jev input tokens
          </p>

          <ul className="mt-6 space-y-3 text-sm text-gray-600">
            <li className="flex gap-2">
              <Check className="h-4 w-4 text-gray-950" />
              One-time recharge code
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 text-gray-950" />
              $0.42 per 1M input tokens
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 text-gray-950" />
              Output tokens are not charged
            </li>
          </ul>

          {product.purchaseUrl ? (
            <Button asChild className="mt-6 w-full">
              <a
                href={product.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Buy recharge code
              </a>
            </Button>
          ) : (
            <Button className="mt-6 w-full" disabled>
              Purchase link pending
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
