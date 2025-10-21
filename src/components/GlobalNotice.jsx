import { useEffect, useState } from 'react';

const DISPLAY_DURATION = 5000;

export default function GlobalNotice() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      const incoming = event?.detail?.message || 'Cached data displayed';
      setMessage(incoming);
      setVisible(true);
    };

    window.addEventListener('api:fallback', handler);

    return () => {
      window.removeEventListener('api:fallback', handler);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    const timeout = setTimeout(() => {
      setVisible(false);
    }, DISPLAY_DURATION);

    return () => clearTimeout(timeout);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-emerald-200 bg-white/90 shadow-lg backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 text-sm text-emerald-700">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
}
