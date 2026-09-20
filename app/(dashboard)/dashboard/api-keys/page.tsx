import { KeyRound, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function ApiKeysPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Access</p>
          <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Create API key
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
            <KeyRound className="h-8 w-8 text-gray-400" />
            <p className="mt-4 font-medium">No API keys yet</p>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Key issuance is intentionally disabled in phase 1. The page and
              navigation are ready; phase 2 will connect key creation to a
              funded credit balance and the Jev delivery service.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
