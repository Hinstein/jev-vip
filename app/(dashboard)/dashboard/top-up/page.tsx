import { ProductGrid } from '@/components/jev/product-grid';
import { products } from '@/lib/jev/config';

export default function TopUpPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <p className="text-sm text-gray-500">Sales channel</p>
      <h1 className="text-2xl font-semibold tracking-tight">Buy Credits</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-500">
        Buy a package through the configured sales channel and redeem the
        delivered New API redemption code on this site.
      </p>
      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
