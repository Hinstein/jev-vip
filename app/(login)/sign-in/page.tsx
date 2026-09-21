import { Suspense } from 'react';
import { Login } from '../login';
import { getNewApiAuthStatus } from '@/lib/new-api/auth';

export default async function SignInPage() {
  const authStatus = await getNewApiAuthStatus();

  return (
    <Suspense>
      <Login mode="signin" authStatus={authStatus} />
    </Suspense>
  );
}
