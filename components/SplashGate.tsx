'use client';

import { useEffect, useState } from 'react';

const SPLASH_KEY = 'betsfriends_splash_shown';

export default function SplashGate({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Only show the splash once per browser session — not on every
    // page navigation (e.g. opening a player or team page).
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SPLASH_KEY) === '1';
    } catch {
      // sessionStorage unavailable (e.g. private mode) — just skip the splash
      alreadyShown = true;
    }

    if (alreadyShown) return;

    setShow(true);
    try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch {}

    const fadeTimer = setTimeout(() => setFadeOut(true), 1400);
    const hideTimer = setTimeout(() => setShow(false), 1900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {children}
      {show && (
        <div
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
            fadeOut ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ background: '#0A0A0A', pointerEvents: fadeOut ? 'none' : 'auto' }}
        >
          {/* Host nation stripe */}
          <div className="absolute top-0 left-0 right-0 h-[3px] flex">
            <div className="flex-1" style={{ background: '#1F3A8A' }} />
            <div className="flex-1" style={{ background: '#DC2626' }} />
            <div className="flex-1" style={{ background: '#047857' }} />
          </div>

          {/* Subtle gold radial behind */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 40%, rgba(201,165,87,0.15), transparent 50%)',
              pointerEvents: 'none',
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center px-6 max-w-md w-full">
            <div className="splash-eyebrow text-gold text-xs font-bold tracking-[4px] mb-3 opacity-0 animate-[fadeUp_0.5s_0.1s_forwards]">
              — WORLD CUP 26 —
            </div>
            <div className="splash-name font-display text-white text-5xl md:text-6xl italic mb-6 opacity-0 animate-[fadeUp_0.6s_0.25s_forwards]">
              BetsFriends
            </div>
            <div className="relative w-full flex justify-center opacity-0 animate-[fadeUp_0.7s_0.45s_forwards]">
              <div
                className="font-display text-7xl"
                style={{
                  background: 'linear-gradient(135deg, #1F3A8A 0%, #DC2626 50%, #047857 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.5))',
                }}
              >
                ⚽
              </div>
            </div>
            <div className="splash-tag mt-6 text-text-muted text-xs font-bold tracking-[3px] opacity-0 animate-[fadeUp_0.6s_0.7s_forwards]">
              TWO IRISH  ·  TWO ENGLISH
            </div>
            <div className="text-gold text-xs font-bold tracking-[3px] mt-2 opacity-0 animate-[fadeUp_0.6s_0.85s_forwards]">
              ONE TROPHY
            </div>
          </div>

          <style>{`
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
