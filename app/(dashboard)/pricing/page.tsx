import { ProductGrid } from '@/components/jev/product-grid';
import { getActiveProducts } from '@/lib/credits/queries';
import { productConfig } from '@/lib/jev/config';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const products = await getActiveProducts();

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-gray-500">Prepaid credits</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Choose a Jev credit pack
        </h1>
        <p className="mt-4 text-gray-600">
          Buy a recharge code through the listed sales channel, then redeem it
          to your account. Credits are managed by New API and do not expire in
          the JEV frontend.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-5xl">
        <ProductGrid products={products} />
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-gray-500">
        {productConfig.officialDisclaimer}
      </p>
    </main>
  );
}
