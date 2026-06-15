'use client';
import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || 'Wrong password');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <div className="card max-w-md w-full p-8 relative overflow-hidden">
        <div className="flag-stripe absolute top-0 left-0 right-0" />
        <div className="mt-2 mb-8 text-center">
          <div className="font-display text-7xl leading-none">
            <div className="text-gold-bright italic">2</div>
            <div className="text-gold italic -mt-2">6</div>
          </div>
          <div className="eyebrow text-gold mt-4">World Cup 26</div>
          <div className="display-title text-3xl mt-1">BetsFriends</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="eyebrow block mb-2">Team password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} autoFocus value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base w-full pr-10" placeholder="Enter shared password" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
              </button>
            </div>
          </div>
          {error && <p style={{color:'var(--red-bright)'}} className="text-sm">{error}</p>}
          <button type="submit" disabled={loading || !password} className="btn-primary w-full">
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
