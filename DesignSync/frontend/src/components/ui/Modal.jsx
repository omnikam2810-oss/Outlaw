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
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 shadow-2xl modal-enter">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="h-5 w-5 text-slate-500" />
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
