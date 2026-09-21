import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import { getCreditBalance } from '@/lib/credits/queries';
import { hashApiKey } from '@/lib/api-keys/crypto';
import {
  registerApiKey,
  revokeApiKeyForUser,
} from '@/lib/api-keys/queries';
import {
  createLiteLLMVirtualKey,
  deleteLiteLLMKeyBySecret,
  deleteLiteLLMVirtualKey,
  listLiteLLMVirtualKeys,
} from '@/lib/litellm/client';

const createSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

const deleteSchema = z.object({
  tokenId: z.string().min(16).max(256),
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
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const keys = await listLiteLLMVirtualKeys(user.id);
    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Failed to list LiteLLM keys', error);
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

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const balance = await getCreditBalance(user.id);
  if (balance <= 0) {
    return NextResponse.json(
      { error: 'Redeem credits before creating an API key.' },
      { status: 402 }
    );
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
    const created = await createLiteLLMVirtualKey(user.id, parsed.data.name);

    try {
      await registerApiKey({
        userId: user.id,
        providerTokenId: created.tokenId ?? hashApiKey(created.key),
        keyHash: hashApiKey(created.key),
        keyName: parsed.data.name,
      });
    } catch (error) {
      console.error('Failed to persist API key ownership', error);
      try {
        // Delete by the one-time secret first. This avoids a race with
        // /key/list eventual consistency and does not put the secret in a URL.
        await deleteLiteLLMKeyBySecret(created.key);
      } catch (cleanupError) {
        console.error('Failed to clean up unregistered LiteLLM key', cleanupError);
        if (created.tokenId) {
          try {
            await deleteLiteLLMVirtualKey(user.id, created.tokenId);
          } catch (fallbackCleanupError) {
            console.error(
              'Fallback cleanup of unregistered LiteLLM key failed',
              fallbackCleanupError
            );
          }
        }
      }
      return NextResponse.json(
        { error: 'API key service is unavailable.' },
        { status: 503 }
      );
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create LiteLLM key', error);
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

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid API key id.' }, { status: 400 });
  }

  try {
    const remoteDeleted = await deleteLiteLLMVirtualKey(
      user.id,
      parsed.data.tokenId
    );
    const localRevoked = await revokeApiKeyForUser(
      user.id,
      parsed.data.tokenId,
      hashApiKey(parsed.data.tokenId)
    );

    if (!remoteDeleted && !localRevoked) {
      throw new Error('API key was not found for this user');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete LiteLLM key', error);
    return NextResponse.json(
      { error: 'Unable to delete this API key.' },
      { status: 400 }
    );
  }
}
