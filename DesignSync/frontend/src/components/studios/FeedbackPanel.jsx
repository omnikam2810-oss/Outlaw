import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, CheckCircle2, Reply, Send, Loader2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import api from '../../api/axios';
import { useToast } from '../ui/useToast';
import { useAuth } from '../../context/useAuth';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false,
});

function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ReplyThread({ thread, pinNumber, onResolved }) {
  const [replyText, setReplyText] = useState('');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const { addToast } = useToast();
  const { user } = useAuth();

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/feedback/${thread._id}/reply`, { comment: replyText });
      setReplyText('');
      setOpen(false);
    } catch {
      addToast('Failed to post reply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resolve = async () => {
    setResolving(true);
    try {
      await api.put(`/feedback/${thread._id}/resolve`);
      onResolved(thread._id);
    } catch {
      addToast('Failed to resolve thread', 'error');
    } finally {
      setResolving(false);
    }
  };

  const isResolved = thread.status === 'resolved';

  return (
    <div id={`feedback-thread-${thread._id}`} className={`rounded-xl border p-3 space-y-2 transition-all ${isResolved ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 opacity-70' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
      {/* Thread header */}
      <div className="flex items-start gap-2 relative">
        {thread.position && !isResolved && (
          <div className="absolute -left-2 -top-2 flex items-center justify-center w-5 h-5 bg-indigo-500 text-white text-[10px] font-bold rounded-full border border-white shadow-sm z-10 pointer-events-none">
            {pinNumber}
          </div>
        )}
        <Avatar src={thread.authorId?.avatar} fallback={thread.authorId?.name || '?'} size="7" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{thread.authorId?.name || 'Unknown'}</p>
            <span className="text-xs text-slate-400 shrink-0">{timeAgo(thread.createdAt)}</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{thread.comment}</p>
        </div>
      </div>

      {/* Replies */}
      {thread.replies?.length > 0 && (
        <div className="ml-9 space-y-2 border-l-2 border-slate-100 dark:border-slate-700 pl-3">
          {thread.replies.map((reply, i) => (
            <div key={i} className="flex items-start gap-2">
              <Avatar src={reply.authorId?.avatar} fallback={reply.authorId?.name || '?'} size="6" />
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{reply.authorId?.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{reply.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {!isResolved && (
        <div className="ml-9 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium"
          >
            <Reply className="w-3 h-3" /> Reply
          </button>
          {(user?.role === 'admin' || user?.role === 'designer') && (
            <button
              onClick={resolve}
              disabled={resolving}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 font-medium"
            >
              {resolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Resolve
            </button>
          )}
        </div>
      )}
      {isResolved && (
        <div className="ml-9 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-3 h-3" /> Resolved
        </div>
      )}

      {/* Inline reply composer */}
      {open && !isResolved && (
        <div className="ml-9 flex items-center gap-2 mt-1">
          <input
            autoFocus
            className="flex-1 text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submitReply()}
          />
          <button
            onClick={submitReply}
            disabled={submitting || !replyText.trim()}
            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}

export default function FeedbackPanel({ deliverable, threads = [], setThreads, onAddFeedback }) {
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!deliverable?._id) {
      setThreads([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/deliverables/${deliverable._id}/feedback`);
        setThreads(data.data);
      } catch {
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };

    load();

    // Socket real-time updates
    socket.connect();
    const onNew = (thread) => setThreads((prev) => (
      prev.some((existing) => existing._id === thread._id) ? prev : [thread, ...prev]
    ));
    const onReply = (updated) => setThreads((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    const onResolved = (updated) => setThreads((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));

    socket.on(`feedback:new:${deliverable._id}`, onNew);
    socket.on(`feedback:reply:${deliverable._id}`, onReply);
    socket.on(`feedback:resolved:${deliverable._id}`, onResolved);

    return () => {
      socket.off(`feedback:new:${deliverable._id}`, onNew);
      socket.off(`feedback:reply:${deliverable._id}`, onReply);
      socket.off(`feedback:resolved:${deliverable._id}`, onResolved);
      socket.disconnect();
    };
  }, [deliverable?._id, setThreads]);

  const handleResolved = (threadId) => {
    setThreads((prev) => prev.map((t) => (t._id === threadId ? { ...t, status: 'resolved' } : t)));
  };

  const openCount = threads.filter((t) => t.status !== 'resolved').length;

  return (
    <div className="h-72 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          Feedback
          {openCount > 0 && (
            <Badge variant="warning" className="text-xs px-1.5 py-0.5">{openCount} open</Badge>
          )}
        </h3>
        {deliverable && (
          <Button size="sm" onClick={onAddFeedback} className="text-xs h-7 px-3">
            + Add Comment
          </Button>
        )}
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!deliverable ? (
          <p className="text-xs text-slate-400 text-center mt-4">Select a deliverable to view feedback.</p>
        ) : loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 skeleton rounded-xl" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <p className="text-xs text-slate-400 text-center mt-4">No feedback yet. Be the first to add a comment!</p>
        ) : (
          threads.map((thread, idx) => (
            <ReplyThread key={thread._id} thread={thread} pinNumber={idx + 1} onResolved={handleResolved} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
