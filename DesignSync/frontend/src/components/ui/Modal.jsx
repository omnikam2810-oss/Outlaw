import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const onKey = (e) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', onKey);
      };
    }
    document.body.style.overflow = 'unset';
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative mt-20 w-full max-w-lg overflow-hidden rounded-lg border border-white/80 bg-white shadow-2xl shadow-slate-950/20 modal-enter dark:border-white/[0.08] dark:bg-[#2D3748]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-950 dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

export { Modal };
