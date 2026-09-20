import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { redeemNewApiCode } from '@/lib/new-api/client';
import { hasSameOrigin } from '@/lib/http/origin';
import {
  readJsonWithLimit,
  RequestBodyTooLargeError,
} from '@/lib/http/json';

const MAX_MUTATION_BODY_BYTES = 16 * 1024;

const redeemSchema = z.object({
  code: z.string().trim().min(4).max(128),
});

export async function POST(request: NextRequest) {
  try {
    if (!hasSameOrigin(request)) {
      return NextResponse.json(
        { ok: false, code: 'invalid_origin', message: 'Invalid request origin.' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Origin validation is not configured', error);
    return NextResponse.json(
      { ok: false, code: 'server_config', message: 'Server is not configured.' },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await readJsonWithLimit(request, MAX_MUTATION_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { ok: false, code: 'too_large', message: 'Request body is too large.' },
        { status: 413 }
      );
    }
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
        message: 'This code could not be redeemed.',
      },
      { status: 400 }
    );
  }
}
