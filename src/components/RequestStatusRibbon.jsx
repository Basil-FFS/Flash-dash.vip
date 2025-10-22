import { useEffect, useState } from 'react';

const DISPLAY_MS = 4500;

const TYPE_STYLES = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: 'bg-emerald-500'
  },
  error: {
    wrapper: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: 'bg-rose-500'
  },
  info: {
    wrapper: 'border-slate-200 bg-white text-slate-700',
    icon: 'bg-slate-400'
  }
};

export default function RequestStatusRibbon() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const handler = (event) => {
      const detail = event?.detail || {};
      const type = detail.type === 'error' || detail.type === 'success' ? detail.type : 'info';
      setStatus({
        type,
        message: detail.message || 'Request processed',
        timestamp: Date.now()
      });
    };

    window.addEventListener('api:status', handler);

    return () => {
      window.removeEventListener('api:status', handler);
    };
  }, []);

  useEffect(() => {
    if (!status) return;

    const timer = setTimeout(() => {
      setStatus(null);
    }, DISPLAY_MS);

    return () => clearTimeout(timer);
  }, [status]);

  if (!status) {
    return null;
  }

  const tone = TYPE_STYLES[status.type] || TYPE_STYLES.info;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div
        className={`flex max-w-xs items-center gap-3 rounded-full border px-4 py-2 text-sm shadow-lg transition-all duration-200 ${tone.wrapper}`}
      >
        <span className={`inline-flex h-2.5 w-2.5 rounded-full ${tone.icon}`} aria-hidden />
        <span className="font-medium">{status.message}</span>
      </div>
    </div>
  );
}
