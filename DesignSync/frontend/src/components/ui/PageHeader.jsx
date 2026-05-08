import React from 'react';
import { cn } from '../../utils/cn';

const PageHeader = ({ eyebrow, icon: Icon, title, description, actions, meta, className }) => (
  <section className={cn('page-panel', className)}>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="eyebrow">
            {Icon && <Icon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-300" />}
            {eyebrow}
          </div>
        )}
        <h1 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {(actions || meta) && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {meta}
          {actions}
        </div>
      )}
    </div>
  </section>
);

export { PageHeader };
