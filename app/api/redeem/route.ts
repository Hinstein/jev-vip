import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import { redeemVoucherForUser } from '@/lib/jev/redeem';

const redeemSchema = z.object({
  code: z.string().trim().min(4).max(128),
});

function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const baseUrl = process.env.BASE_URL;

  if (!origin || !baseUrl) return true;

  try {
    return new URL(origin).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { ok: false, code: 'invalid_origin', message: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, code: 'unauthorized', message: 'Please sign in first.' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: 'invalid_request', message: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: 'invalid_code',
        message: 'Enter a valid redemption code.',
      },
      { status: 400 }
    );
  }

  const result = await redeemVoucherForUser(user.id, parsed.data.code);

  if (!result.ok) {
    const status = result.retryable ? 503 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
