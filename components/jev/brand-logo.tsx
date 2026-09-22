/** Shared brand lockup. Decorative mark; the wordmark supplies the accessible name. */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap">
      {/* A fixed-size SVG avoids layout shift and stays crisp at every pixel density. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/jev-mark.svg" alt="" width={compact ? 28 : 36} height={compact ? 28 : 36} />
      <span className={compact ? 'text-base font-semibold tracking-tight text-gray-950' : 'text-xl font-semibold tracking-[-0.04em] text-gray-950'}>JEV Store</span>
    </span>
  );
}
