'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface Tip {
  match: string;
  tip: string;
}

export default function DailyTips() {
  const [tips, setTips] = useState<Tip[] | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tips')
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setError(j.error);
        else {
          setTips(j.tips || []);
          setMessage(j.message || '');
        }
        setLoading(false);
      })
      .catch(() => { setError('Could not load tips.'); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="card p-4">
        <div className="eyebrow mb-1 flex items-center gap-2">
          <Sparkles size={14} strokeWidth={2} style={{ color: 'var(--gold-bright)' }} fill="rgba(232,200,106,0.2)" />
          Daily Tips
        </div>
        <div className="text-text-muted text-sm animate-pulse">Looking at upcoming form…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4">
        <div className="eyebrow mb-1 flex items-center gap-2">
          <Sparkles size={14} strokeWidth={2} style={{ color: 'var(--gold-bright)' }} fill="rgba(232,200,106,0.2)" />
          Daily Tips
        </div>
        <div className="text-xs" style={{ color: 'var(--red-bright)' }}>{error}</div>
      </div>
    );
  }

  if (!tips || tips.length === 0) {
    return (
      <div className="card p-4">
        <div className="eyebrow mb-1 flex items-center gap-2">
          <Sparkles size={14} strokeWidth={2} style={{ color: 'var(--gold-bright)' }} fill="rgba(232,200,106,0.2)" />
          Daily Tips
        </div>
        <div className="text-text-dim text-sm">{message || 'Nothing in the next 48 hours to look at yet.'}</div>
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="eyebrow flex items-center gap-2">
        <Sparkles size={14} strokeWidth={2} style={{ color: 'var(--gold-bright)' }} fill="rgba(232,200,106,0.2)" />
        Daily Tips · based on recent form
      </div>
      <div className="space-y-2">
        {tips.map((t, i) => (
          <div key={i} className="text-sm p-2.5 rounded" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <div className="font-semibold text-xs mb-1" style={{ color: 'var(--gold-bright)' }}>{t.match}</div>
            <div className="text-text-muted">{t.tip}</div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-text-dim">Just for fun — based on recent results only, no odds or predictions data.</div>
    </div>
  );
}
