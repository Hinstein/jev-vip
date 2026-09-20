import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createNewApiToken,
  deleteNewApiToken,
  listNewApiTokens,
} from '@/lib/new-api/client';
import { hasSameOrigin } from '@/lib/http/origin';
import {
  readJsonWithLimit,
  RequestBodyTooLargeError,
} from '@/lib/http/json';

const MAX_MUTATION_BODY_BYTES = 16 * 1024;

const createSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

const deleteSchema = z.object({
  tokenId: z.number().int().positive(),
});

function rejectBadOrigin(request: NextRequest) {
  try {
    return !hasSameOrigin(request);
  } catch (error) {
    console.error('Origin validation is not configured', error);
    return null;
  }
}

async function readMutationBody(request: NextRequest) {
  try {
    return await readJsonWithLimit(request, MAX_MUTATION_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { error: 'Request body is too large.' },
        { status: 413 }
      );
    }
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
}

export async function GET() {
  try {
    const keys = await listNewApiTokens();
    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Failed to list New API keys', error);
    return NextResponse.json(
      { error: 'API key service is unavailable.' },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const badOrigin = rejectBadOrigin(request);
  if (badOrigin === null) {
    return NextResponse.json({ error: 'Server is not configured.' }, { status: 500 });
  }
  if (badOrigin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const body = await readMutationBody(request);
  if (body instanceof NextResponse) return body;

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'API key name must be between 1 and 50 characters.' },
      { status: 400 }
    );
  }

  try {
    const created = await createNewApiToken(parsed.data.name);
    return NextResponse.json(
      { key: created.key, token: created.token },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create New API key', error);
    return NextResponse.json(
      { error: 'API key service is unavailable.' },
      { status: 503 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const badOrigin = rejectBadOrigin(request);
  if (badOrigin === null) {
    return NextResponse.json({ error: 'Server is not configured.' }, { status: 500 });
  }
  if (badOrigin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const body = await readMutationBody(request);
  if (body instanceof NextResponse) return body;

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid token id.' }, { status: 400 });
  }

  try {
    await deleteNewApiToken(parsed.data.tokenId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to revoke New API key', error);
    return NextResponse.json(
      { error: 'API key service is unavailable.' },
      { status: 503 }
    );
  }
}
