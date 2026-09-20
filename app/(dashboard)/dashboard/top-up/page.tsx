import { ProductGrid } from '@/components/jev/product-grid';
import { getActiveProducts } from '@/lib/jev/products';
import { getJevRetailPricing } from '@/lib/new-api/pricing';

export const dynamic = 'force-dynamic';

export default async function TopUpPage() {
  const products = getActiveProducts();
  const pricing = await getJevRetailPricing();

  return (
    <section className="flex-1 px-4 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-gray-500">Top up</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Buy Jev API balance
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
          Choose a pack, complete the purchase in the configured sales channel,
          then redeem the delivered code on this site.
        </p>

        <div className="mt-8">
          <ProductGrid
          products={products}
          inputUsdPerMillion={pricing.inputUsdPerMillion}
          outputUsdPerMillion={pricing.outputUsdPerMillion}
        />
        </div>
      </div>
    </section>
  );
}
