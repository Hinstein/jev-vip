import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { forwardedForFromHeaders } from '@/lib/http/client-ip';
import { hasSameOrigin } from '@/lib/http/origin';
import {
  readJsonWithLimit,
  RequestBodyTooLargeError,
} from '@/lib/http/json';
import { sendNewApiVerificationCode } from '@/lib/new-api/auth';

const MAX_BODY_BYTES = 16 * 1024;

const requestSchema = z.object({
  email: z.string().trim().email().max(255),
  turnstile: z.string().trim().max(4096).optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!hasSameOrigin(request)) {
      return NextResponse.json(
        { success: false, message: 'Invalid request origin.' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Origin validation is not configured', error);
    return NextResponse.json(
      { success: false, message: 'Server is not configured.' },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await readJsonWithLimit(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { success: false, message: 'Request body is too large.' },
        { status: 413 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }

  const result = requestSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { success: false, message: 'Please enter a valid email address.' },
      { status: 400 }
    );
  }

  try {
    const { response, payload } = await sendNewApiVerificationCode(
      result.data.email,
      {
        forwardedFor: forwardedForFromHeaders(request.headers),
        userAgent: request.headers.get('user-agent'),
      },
      { turnstile: result.data.turnstile }
    );

    const status = response.status >= 500 ? 502 : response.status;
    return Response.json(
      {
        success: response.ok && payload.success !== false,
        message: payload.message || '',
      },
      { status }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'JEV account service is temporarily unavailable',
      },
      { status: 503 }
    );
  }
}
