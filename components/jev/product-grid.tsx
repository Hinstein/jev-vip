import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { JevProduct } from '@/lib/jev/products';
import {
  formatApproxInputTokens,
  formatUsdFromQuota,
} from '@/lib/jev/billing';
import { getI18n } from '@/lib/i18n/server';
import { LocaleLink } from '@/components/i18n/locale-link';

function formatPrice(product: JevProduct) {
  return `¥${(product.priceMinor / 100).toFixed(0)}`;
}

export async function ProductGrid({
  products,
  inputUsdPerMillion,
  outputUsdPerMillion,
}: {
  products: JevProduct[];
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
}) {
  const { t } = await getI18n();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {products.map((product) => (
        <div key={product.id} className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold">{product.name}</h2>
          <p className="mt-4 text-4xl font-semibold tracking-tight">
            {formatPrice(product)}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {formatUsdFromQuota(product.credits)} {t('product.apiBalance')}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            ≈ {formatApproxInputTokens(product.credits, inputUsdPerMillion)}{' '}
            {t('product.inputTokens')}
          </p>

          <ul className="mt-6 space-y-3 text-sm text-gray-600">
            <li className="flex gap-2">
              <Check className="h-4 w-4 text-gray-950" />
              {t('product.oneTimeRechargeCode')}
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 text-gray-950" />
              ${inputUsdPerMillion.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}{' '}
              {t('product.inputTokens')}
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 text-gray-950" />
              {t('product.outputTokens', {
                value: `$${outputUsdPerMillion.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}`,
              })}
            </li>
          </ul>

          {product.purchaseUrl ? (
            <Button asChild className="mt-6 w-full">
              <a
                href={product.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                {t('product.buyRechargeCode')}
              </a>
            </Button>
          ) : (
            <Button className="mt-6 w-full" disabled>
              {t('product.purchasePending')}
            </Button>
          )}

          <Button asChild variant="outline" className="mt-2 w-full">
            <LocaleLink href="/redeem">{t('product.alreadyHaveCode')}</LocaleLink>
          </Button>
        </div>
      ))}
    </div>
  );
}
