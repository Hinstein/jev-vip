import 'server-only';

import { getSession } from '@/lib/auth/session';
import { getNewApiSelfByAccessToken } from '@/lib/new-api/client';

export async function getUser() {
  const session = await getSession();
  if (!session) return null;

  try {
    return await getNewApiSelfByAccessToken(session.accessToken);
  } catch {
    return null;
  }
}
