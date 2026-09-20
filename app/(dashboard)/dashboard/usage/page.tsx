'use client';

import { useEffect, useState } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';
import type { ApiEnvelope, PageData } from '@/lib/new-api/types';

type UsageLog = {
  id?: number;
  created_at?: number;
  created_time?: number;
  model_name?: string;
  model?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  quota?: number;
  content?: string;
};

export default function UsagePage() {
  const { user, authFetch } = useAuth();
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void authFetch('/api/log/self?p=1&page_size=20')
      .then((response) => response.json())
      .then((payload: ApiEnvelope<PageData<UsageLog> | UsageLog[]>) => {
        const data = payload.data;
        setLogs(Array.isArray(data) ? data : data?.items ?? []);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [user, authFetch]);

  if (!user) return null;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <p className="text-sm text-gray-500">Metering</p>
      <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric
          label="Requests"
          value={new Intl.NumberFormat('en-US').format(user.request_count || 0)}
        />
        <Metric
          label="Used credits"
          value={new Intl.NumberFormat('en-US').format(user.used_quota || 0)}
        />
        <Metric
          label="Remaining"
          value={new Intl.NumberFormat('en-US').format(user.quota || 0)}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent usage</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
              <Activity className="h-8 w-8 text-gray-400" />
              <p className="mt-4 font-medium">No usage recorded</p>
              <p className="mt-1 text-sm text-gray-500">
                New API request logs will appear here after the first API call.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log, index) => {
                const timestamp = log.created_at ?? log.created_time;
                return (
                  <div key={log.id ?? index} className="grid gap-1 py-3 sm:grid-cols-4">
                    <span className="text-sm font-medium">
                      {log.model_name || log.model || 'API request'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {timestamp
                        ? new Date(timestamp * 1000).toLocaleString()
                        : '—'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Input {log.prompt_tokens ?? 0} · Output {log.completion_tokens ?? 0}
                    </span>
                    <span className="text-xs text-gray-500 sm:text-right">
                      {log.quota ?? 0} credits
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
