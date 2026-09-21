import { ProductGrid } from '@/components/jev/product-grid';
import { getActiveProducts } from '@/lib/jev/products';
import { productConfig } from '@/lib/jev/config';
import { getJevRetailPricing } from '@/lib/new-api/pricing';
import { getI18n } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const products = getActiveProducts();
  const pricing = await getJevRetailPricing();
  const { t } = await getI18n();

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-gray-500">{t('pricing.eyebrow')}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          {t('pricing.title')}
        </h1>
        <p className="mt-4 text-gray-600">
          {t('pricing.description')}
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-5xl">
        <ProductGrid
          products={products}
          inputUsdPerMillion={pricing.inputUsdPerMillion}
          outputUsdPerMillion={pricing.outputUsdPerMillion}
        />
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-gray-500">
        {productConfig.officialDisclaimer}
      </p>
    </main>
  );
}
