import React from 'react';
import { cn } from '../../utils/cn';

const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', isLoading, asChild = false, children, ...props }, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold tracking-normal transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-teal-300/50 dark:focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-slate-950 text-white shadow-sm shadow-slate-900/10 hover:bg-slate-800 hover:shadow-md dark:bg-teal-300 dark:text-slate-950 dark:hover:bg-teal-200',
    secondary: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10',
    danger: 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-50',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-1.5 text-sm',
    lg: 'h-11 px-5 text-sm',
    icon: 'h-9 w-9',
  };

  const renderContent = (buttonChildren) => (
    <>
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {buttonChildren}
    </>
  );

  const resolvedClassName = cn(baseStyles, variants[variant], sizes[size], className);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref,
      className: cn(resolvedClassName, children.props.className),
      'aria-disabled': isLoading || props.disabled || children.props['aria-disabled'],
      tabIndex: isLoading || props.disabled ? -1 : children.props.tabIndex,
      ...props,
      children: renderContent(children.props.children),
    });
  }

  return (
    <button
      ref={ref}
      className={resolvedClassName}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {renderContent(children)}
    </button>
  );
});

Button.displayName = 'Button';
export { Button };
