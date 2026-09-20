import { ProductGrid } from '@/components/jev/product-grid';
import { getActiveProducts } from '@/lib/jev/products';
import { productConfig } from '@/lib/jev/config';
import { getJevRetailPricing } from '@/lib/new-api/pricing';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const products = getActiveProducts();
  const pricing = await getJevRetailPricing();

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-gray-500">Prepaid API balance</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Choose a Jev recharge pack
        </h1>
        <p className="mt-4 text-gray-600">
          Buy a recharge code through the listed sales channel, then redeem it
          to your account. The balance is available immediately after a
          successful redemption.
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
