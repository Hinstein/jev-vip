import { Suspense } from 'react';
import { Login } from '../login';
import { getNewApiAuthStatus } from '@/lib/new-api/auth';

export default async function SignUpPage() {
  const authStatus = await getNewApiAuthStatus();

  return (
    <Suspense>
      <Login mode="signup" authStatus={authStatus} />
    </Suspense>
  );
}
