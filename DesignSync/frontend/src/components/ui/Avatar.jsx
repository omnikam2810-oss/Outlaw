import React from 'react';
import { cn } from '../../utils/cn';

const Avatar = ({ src, fallback, size = '10', className }) => {
  const sizeClasses = `w-${size} h-${size}`;
  
  return (
    <div className={cn('relative inline-flex flex-shrink-0 items-center justify-center rounded-full overflow-hidden bg-slate-200 dark:bg-white/[0.08]', sizeClasses, className)}>
      {src ? (
        <img src={src} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold text-slate-500 dark:text-slate-300 text-sm">{fallback?.slice(0, 2).toUpperCase() || 'U'}</span>
      )}
    </div>
  );
};

export { Avatar };
