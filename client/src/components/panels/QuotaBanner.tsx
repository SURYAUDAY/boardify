import { useEffect, useState } from 'react';
import { Sparkles, Clock } from 'lucide-react';
import api from '../../lib/api';

interface QuotaState {
  limit: number;
  windowHours: number;
  used: number;
  remaining: number;
  nextAvailableAt: string | null;
}

function formatRelative(targetIso: string | null): string {
  if (!targetIso) return '';
  const ms = new Date(targetIso).getTime() - Date.now();
  if (ms <= 0) return 'now';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Lightweight banner above each AI tab — pulls quota on mount and after each
// AI call (parent triggers refresh via `refreshKey`).
export default function QuotaBanner({ refreshKey }: { refreshKey: number }) {
  const [quota, setQuota] = useState<QuotaState | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<QuotaState>('/ai/quota')
      .then((res) => {
        if (!cancelled) setQuota(res.data);
      })
      .catch(() => {
        /* silent — banner is informational only */
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (!quota) return null;

  const exhausted = quota.remaining === 0;
  const wait = formatRelative(quota.nextAvailableAt);

  return (
    <div
      className={`mb-3 px-3 py-2 rounded-lg text-[12px] flex items-center gap-2 ${
        exhausted
          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
          : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
      }`}
    >
      {exhausted ? <Clock className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
      <span className="flex-grow">
        {exhausted ? (
          <>Demo limit reached. Resets in <strong>{wait}</strong>.</>
        ) : (
          <>
            <strong>{quota.remaining}</strong> of {quota.limit} AI calls left today
          </>
        )}
      </span>
    </div>
  );
}
