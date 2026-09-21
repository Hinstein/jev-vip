import { ProductGrid } from '@/components/jev/product-grid';
import { getActiveProducts } from '@/lib/credits/queries';

export const dynamic = 'force-dynamic';

export default async function TopUpPage() {
  const products = await getActiveProducts();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <p className="text-sm text-gray-500">Phase 1 · Sales channel</p>
      <h1 className="text-2xl font-semibold tracking-tight">Buy Credits</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-500">
        JEV VIP does not process payment in Phase 1. Buy a package on Xianyu
        and redeem the delivered code on this site.
      </p>

      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
