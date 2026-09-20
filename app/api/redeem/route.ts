import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { redeemNewApiCode } from '@/lib/new-api/client';

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
      { ok: false, code: 'invalid_code', message: 'Enter a valid redemption code.' },
      { status: 400 }
    );
  }

  try {
    const result = await redeemNewApiCode(parsed.data.code);
    return NextResponse.json({
      ok: true,
      productName: 'Jev credits',
      credited: result.credited,
      balance: result.self.quota,
      alreadyApplied: false,
    });
  } catch (error) {
    console.error('New API redemption failed', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'redeem_failed',
        message: error instanceof Error ? error.message : 'Redemption failed.',
      },
      { status: 400 }
    );
  }
}
