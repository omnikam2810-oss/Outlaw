import React from 'react';
import { Download, File, Image as ImageIcon, FileText, Archive, MessageSquare } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';

export default function DeliverableList({ deliverables, activeDeliverableId, onSelect, feedbackCounts = {} }) {
  const getIcon = (type) => {
    if (!type) return <File className="h-6 w-6 text-teal-600" />;
    if (type.includes('image')) return <ImageIcon className="h-6 w-6 text-teal-600" />;
    if (type.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />;
    if (type.includes('zip')) return <Archive className="h-6 w-6 text-amber-500" />;
    return <File className="h-6 w-6 text-teal-600" />;
  };

  const getTimeAgo = (dateString) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > -1) {
       const hoursDifference = Math.round((new Date(dateString) - new Date()) / (1000 * 60 * 60));
       if (hoursDifference === 0) return 'Just now';
       return rtf.format(hoursDifference, 'hour');
    }
    return rtf.format(daysDifference, 'day');
  };

  if (!deliverables || deliverables.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 dark:bg-white/[0.04] rounded-lg border border-dashed border-slate-300 dark:border-white/[0.08]">
        <File className="mx-auto h-12 w-12 text-slate-400 mb-3" />
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">No deliverables yet</h3>
        <p className="mt-1 text-sm text-slate-500">Upload the first file to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deliverables.map((item) => {
        const isActive = activeDeliverableId === item._id;
        return (
          <div 
            key={item._id}
            onClick={() => onSelect(item)}
            className={`flex flex-col sm:flex-row gap-4 p-3 rounded-lg border transition-all cursor-pointer ${
              isActive 
                ? 'bg-white border-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-slate-900 dark:border-slate-300 dark:ring-slate-300' 
                : 'bg-white border-slate-200/60 dark:bg-[#2D3748] dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16]'
            }`}
          >
            <div className="flex-1 flex gap-3 overflow-hidden items-center">
              <div className="shrink-0 p-2 bg-slate-50 dark:bg-[#202833] rounded-md border border-slate-100 dark:border-white/[0.08]">
                {getIcon(item.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate tracking-tight">{item.title}</h4>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-[#202833] px-1 rounded uppercase">v{item.version}</span>
                </div>
                
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                  {item.uploadedBy && (
                    <>
                      <span>{item.uploadedBy.name}</span>
                      <span className="text-slate-300">•</span>
                    </>
                  )}
                  <span>{getTimeAgo(item.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {feedbackCounts[item._id] > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
                   {feedbackCounts[item._id]}
                </div>
              )}
              <a 
                href={item.fileUrl}
                download
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
