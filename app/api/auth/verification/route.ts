import { z } from 'zod';
import { forwardedForFromHeaders } from '@/lib/http/client-ip';
import { sendNewApiVerificationCode } from '@/lib/new-api/auth';

const requestSchema = z.object({
  email: z.string().trim().email().max(255),
  turnstile: z.string().trim().max(4096).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
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
