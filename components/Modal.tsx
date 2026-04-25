import React, { useEffect } from 'react';
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
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow || 'unset';
    };
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
      <div className={`relative my-4 sm:my-8 w-full ${maxWidthClassName} max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] bg-[#111827] border border-[#1F2937] rounded-3xl shadow-2xl p-6 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-200`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E53935]/5 rounded-bl-full -z-10" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-[#0B0F1A] border border-[#1F2937] flex items-center justify-center text-[#E53935]">
                {icon}
              </div>
            )}
            <h2 className="text-xl font-black text-white">{title}</h2>
          </div>
          <button 
            onClick={onClose}
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
