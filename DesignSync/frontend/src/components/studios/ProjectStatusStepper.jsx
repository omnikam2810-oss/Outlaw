import React from 'react';
import { CheckCircle2, Clock, Eye, Package } from 'lucide-react';

const STAGES = [
  { key: 'draft', label: 'Draft', icon: Clock },
  { key: 'in_review', label: 'In Review', icon: Eye },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'delivered', label: 'Delivered', icon: Package },
];

export default function ProjectStatusStepper({ status, onAdvance, canAdvance }) {
  const currentIndex = STAGES.findIndex((s) => s.key === status);
  const nextStage = STAGES[currentIndex + 1];

  return (
    <div className="layout-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">Project Pipeline</h3>
        {canAdvance && nextStage && (
          <button
            onClick={() => onAdvance(nextStage.key)}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full transition-colors"
          >
            Advance → {nextStage.label}
          </button>
        )}
      </div>

      <div className="flex items-center gap-0">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isCompleted = i < currentIndex;
          const isActive = i === currentIndex;
          const isUpcoming = i > currentIndex;

          return (
            <React.Fragment key={stage.key}>
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-indigo-600 text-white'
                      : isActive
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : isUpcoming ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`h-0.5 flex-1 -mt-5 transition-all ${i < currentIndex ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
