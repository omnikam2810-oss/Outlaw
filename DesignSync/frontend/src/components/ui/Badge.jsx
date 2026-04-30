import React from 'react';
import { cn } from '../../utils/cn';

const Badge = ({ children, variant = 'default', className }) => {
  const dotClasses = {
    default: 'bg-slate-400',
    primary: 'bg-indigo-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 bg-white/90 dark:bg-white/5 dark:text-slate-300 border border-white/80 dark:border-white/10 rounded-md shadow-sm backdrop-blur', className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dotClasses[variant])} />
      {children}
    </span>
  );
};

export { Badge };
