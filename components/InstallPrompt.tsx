'use client';

import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Already dismissed?
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('duxtomer-install-dismissed') === '1') return;

    // Already in standalone mode (installed)?
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /android/.test(ua);

    if (isIos) setPlatform('ios');
    else if (isAndroid) setPlatform('android');
    else setPlatform('other');

    // Show after 3s
    const t = setTimeout(() => setShow(true), 3000);

    // Listen for Android install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      clearTimeout(t);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  function dismiss() {
    localStorage.setItem('duxtomer-install-dismissed', '1');
    setShow(false);
  }

  async function triggerInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.promptResult || await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('duxtomer-install-dismissed', '1');
    }
    setDeferredPrompt(null);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 card p-4 relative" style={{ borderColor: 'rgba(201,165,87,0.4)' }}>
      <button
        onClick={dismiss}
        className="absolute top-2 right-3 text-text-muted hover:text-white text-lg"
        aria-label="Dismiss"
      >
        ×
      </button>
      <div className="font-display text-lg italic mb-1">Add DUXTOMER to home</div>
      <div className="text-xs text-text-muted mb-3">
        Install the app for quick access and a full-screen experience.
      </div>

      {platform === 'ios' && (
        <div className="text-sm">
          <div className="flex items-center gap-2 text-text-muted">
            <span>Tap</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V3" /><path d="m6 9 6-6 6 6" /><path d="M5 21h14" />
            </svg>
            <span>in Safari →</span>
            <span className="font-semibold text-white">Add to Home Screen</span>
          </div>
        </div>
      )}

      {platform === 'android' && deferredPrompt && (
        <button onClick={triggerInstall} className="btn-primary w-full">
          Install app
        </button>
      )}

      {platform === 'android' && !deferredPrompt && (
        <div className="text-sm text-text-muted">
          Tap the menu ⋮ in Chrome → <span className="text-white font-semibold">Add to Home screen</span>
        </div>
      )}

      {platform === 'other' && (
        <div className="text-sm text-text-muted">
          Look for "Install app" or "Add to Home Screen" in your browser's menu.
        </div>
      )}
    </div>
  );
}
