import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createNewApiToken,
  deleteNewApiToken,
  listNewApiTokens,
} from '@/lib/new-api/client';

const createSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

const deleteSchema = z.object({
  tokenId: z.number().int().positive(),
});

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const baseUrl = process.env.BASE_URL;
  if (!origin || !baseUrl) return true;

  try {
    return new URL(origin).origin === new URL(baseUrl).origin;
  } catch {
    return false;
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
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

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
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

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
