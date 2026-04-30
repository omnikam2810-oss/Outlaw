import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ToastContext } from './ToastContext';

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center justify-between w-80 p-4 rounded-lg shadow-lg border animate-in slide-in-from-right-full',
              toast.type === 'success' && 'bg-white border-emerald-500 text-slate-800',
              toast.type === 'error' && 'bg-white border-red-500 text-slate-800',
              toast.type === 'info' && 'bg-white border-indigo-500 text-slate-800'
            )}
          >
            <p className="text-sm font-medium">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
