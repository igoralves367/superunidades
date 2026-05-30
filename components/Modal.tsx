import React, { useEffect, useId, useMemo, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  maxWidthClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, icon, maxWidthClassName = 'max-w-md' }) => {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const focusableSelector = useMemo(
    () =>
      [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(','),
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow || 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Focus close button by default to ensure keyboard users land inside the dialog.
    // Use rAF to avoid focusing before the element is in the DOM.
    const raf = window.requestAnimationFrame(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
        return;
      }

      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(focusableSelector);
      firstFocusable?.focus();
    });

    return () => window.cancelAnimationFrame(raf);
  }, [focusableSelector, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const container = modalRef.current;
      if (!container) return;

      const focusables = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
        .filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1);

      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const current = document.activeElement as HTMLElement | null;
      const currentIndex = current ? focusables.indexOf(current) : -1;

      const lastIndex = focusables.length - 1;
      const goingBackward = event.shiftKey;

      // If focus is outside, force it to a sane location.
      if (currentIndex === -1) {
        event.preventDefault();
        (goingBackward ? focusables[lastIndex] : focusables[0]).focus();
        return;
      }

      if (!goingBackward && currentIndex === lastIndex) {
        event.preventDefault();
        focusables[0].focus();
        return;
      }

      if (goingBackward && currentIndex === 0) {
        event.preventDefault();
        focusables[lastIndex].focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusableSelector, isOpen, onClose]);

  useEffect(() => {
    if (isOpen) return;
    if (previouslyFocusedElementRef.current) {
      previouslyFocusedElementRef.current.focus();
      previouslyFocusedElementRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Content */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative my-4 sm:my-8 w-full ${maxWidthClassName} max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] bg-[#111827] border border-[#1F2937] rounded-3xl shadow-2xl p-6 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E53935]/5 rounded-bl-full -z-10" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-[#0B0F1A] border border-[#1F2937] flex items-center justify-center text-[#E53935]">
                {icon}
              </div>
            )}
            <h2 id={titleId} className="text-xl font-black text-white">{title}</h2>
          </div>
          <button 
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Fechar modal"
            className="text-gray-500 hover:text-white bg-[#0B0F1A] p-2 rounded-xl transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="relative z-10 w-full text-white">
          {children}
        </div>
      </div>
    </div>
  );
};
