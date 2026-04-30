import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import api from '../../api/axios';
import { useToast } from '../ui/useToast';
import { ExternalLink, Star } from 'lucide-react';

function StarRating({ rating, setRating }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none transition-transform hover:scale-110"
          aria-label={`Rate ${star} stars`}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              star <= (hover || rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function MentorReviewModal({ isOpen, onClose, submission, onReviewed }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('approved');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) { addToast('Please select a rating', 'error'); return; }
    if (!feedback.trim()) { addToast('Please add feedback notes for the student', 'error'); return; }
    setSubmitting(true);
    try {
      await api.post(`/submissions/${submission._id}/review`, { rating, feedback, status });
      addToast('Review submitted!', 'success');
      onReviewed?.();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => { setRating(0); setFeedback(''); setStatus('approved'); };

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Mentor Review">
      <div className="space-y-5">
        <div>
          <p className="text-sm text-slate-500 mb-1">Reviewing submission by:</p>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{submission?.studentId?.name || 'Student'}</p>
          {submission?.fileUrl && (
            <a
              href={submission.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ExternalLink className="h-4 w-4" />
              Open submitted work
            </a>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rating</label>
          <StarRating rating={rating} setRating={setRating} />
          {rating > 0 && <p className="text-xs text-slate-400 mt-1">{['', 'Needs major work', 'Below expectations', 'Meets expectations', 'Above expectations', 'Outstanding! ⭐'][rating]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Decision</label>
          <div className="flex gap-3">
            {['approved', 'revision_requested'].map((opt) => (
              <button
                key={opt}
                onClick={() => setStatus(opt)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  status === opt
                    ? opt === 'approved'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                }`}
              >
                {opt === 'approved' ? 'Approve' : 'Request Revision'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Feedback Notes</label>
          <textarea
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            rows={3}
            placeholder="Provide detailed feedback to help the student improve..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={submitting} disabled={rating === 0 || !feedback.trim()}>Submit Review</Button>
        </div>
      </div>
    </Modal>
  );
}
