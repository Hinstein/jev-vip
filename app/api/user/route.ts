import { getUser } from '@/lib/new-api/user';

export async function GET() {
  const user = await getUser();
  return Response.json(user);
}
