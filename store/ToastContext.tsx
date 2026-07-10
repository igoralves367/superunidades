import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, default 3500
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3500) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts(prev => [...prev, { id, type, message, duration }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const success = useCallback((msg: string, d?: number) => toast(msg, 'success', d), [toast]);
  const error   = useCallback((msg: string, d?: number) => toast(msg, 'error', d ?? 5000), [toast]);
  const warning = useCallback((msg: string, d?: number) => toast(msg, 'warning', d), [toast]);
  const info    = useCallback((msg: string, d?: number) => toast(msg, 'info', d), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

// ─── UI ──────────────────────────────────────────────────────────────────────

const ACCENT: Record<ToastType, { color: string; glow: string }> = {
  success: { color: '#00F5A0', glow: '0 0 32px rgba(0,245,160,0.25)' },
  error:   { color: '#E53935', glow: '0 0 32px rgba(229,57,53,0.30)' },
  warning: { color: '#FFD60A', glow: '0 0 32px rgba(255,214,10,0.25)' },
  info:    { color: '#00B2FF', glow: '0 0 32px rgba(0,178,255,0.25)' },
};

const ICON: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={20} />,
  error:   <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info:    <Info size={20} />,
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const { color, glow } = ACCENT[toast.type];
  const dur = toast.duration ?? 3500;

  // Entrada: slight delay para montar antes de animar
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)',
        opacity: visible ? 1 : 0,
        transition: 'transform 280ms cubic-bezier(0.34,1.56,0.64,1), opacity 220ms ease',
        boxShadow: `0 8px 40px rgba(0,0,0,0.6), ${glow}`,
      }}
      className="relative flex items-center gap-3 px-5 py-4 rounded-2xl border border-white/10 backdrop-blur-xl bg-[#0D1117]/95 text-white w-full max-w-md overflow-hidden"
    >
      {/* barra lateral colorida */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: color }}
      />

      {/* ícone */}
      <span style={{ color }} className="shrink-0 ml-1">
        {ICON[toast.type]}
      </span>

      {/* mensagem */}
      <span className="flex-1 text-sm font-semibold leading-snug">
        {toast.message}
      </span>

      {/* fechar */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Fechar"
      >
        <X size={14} />
      </button>

      {/* barra de progresso */}
      <ProgressBar duration={dur} color={color} onDone={() => onDismiss(toast.id)} />
    </div>
  );
};

const ProgressBar: React.FC<{ duration: number; color: string; onDone: () => void }> = ({ duration, color, onDone }) => {
  const [width, setWidth] = useState(100);

  useEffect(() => {
    // Força um frame para garantir que começa em 100%
    const raf = requestAnimationFrame(() => {
      setWidth(0);
    });
    const t = setTimeout(onDone, duration);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5 rounded-b-2xl overflow-hidden">
      <div
        style={{
          width: `${width}%`,
          background: color,
          transition: `width ${duration}ms linear`,
          height: '100%',
          opacity: 0.6,
        }}
      />
    </div>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[]; onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 items-center w-full max-w-md px-4 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto w-full">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};
