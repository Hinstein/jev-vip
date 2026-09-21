import { ProductGrid } from '@/components/jev/product-grid';
import { getActiveProducts } from '@/lib/credits/queries';
import { productConfig } from '@/lib/jev/config';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const products = await getActiveProducts();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-gray-500">JEV Credits</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Choose a credit package
        </h1>
        <p className="mt-4 text-gray-600">
          Purchase through Xianyu, receive a unique voucher code, then redeem it
          to your JEV Store account.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-5xl">
        <ProductGrid products={products} />
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-gray-500">
        {productConfig.officialDisclaimer} Xianyu is only a sales channel.
        Voucher lifecycle is handled by OfferKit; JEV Store remains the source of
        truth for credits.
      </p>
    </main>
  );
}
