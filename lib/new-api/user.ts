import 'server-only';

import { getNewApiAccessToken } from '@/lib/auth/new-api-session';
import { getNewApiSelfByAccessToken } from '@/lib/new-api/client';

export async function getUser() {
  let accessToken: string;
  try {
    accessToken = await getNewApiAccessToken();
  } catch {
    return null;
  }

  try {
    return await getNewApiSelfByAccessToken(accessToken);
  } catch {
    return null;
  }
}
