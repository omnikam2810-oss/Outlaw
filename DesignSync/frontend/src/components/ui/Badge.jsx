import React from 'react';
import { cn } from '../../utils/cn';

const Badge = ({ children, variant = 'default', className }) => {
  const dotClasses = {
    default: 'bg-slate-500',
    primary: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-600',
    danger: 'bg-rose-500',
  };

  const variantClasses = {
    default: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-[#F9FAFB]',
    primary: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300',
    danger: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300',
    secondary: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-[#9CA3AF]',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase shadow-sm backdrop-blur', variantClasses[variant] || variantClasses.default, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dotClasses[variant])} />
      {children}
    </span>
  );
};

export { Badge };
