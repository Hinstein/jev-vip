type HeaderReader = {
  get(name: string): string | null;
};

function clean(value: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 512 || /[\r\n\0]/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

/**
 * Returns the client-address header supplied by JEV's trusted edge proxy.
 *
 * Production must not expose the Next.js process directly. The edge proxy/CDN
 * must overwrite client-address headers instead of appending untrusted values.
 */
export function forwardedForFromHeaders(headers: HeaderReader) {
  return (
    clean(headers.get('cf-connecting-ip')) ||
    clean(headers.get('x-forwarded-for')) ||
    clean(headers.get('x-real-ip'))
  );
}
