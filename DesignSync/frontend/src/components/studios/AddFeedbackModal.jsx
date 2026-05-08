import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import api from '../../api/axios';
import { useToast } from '../ui/useToast';

export default function AddFeedbackModal({ isOpen, onClose, deliverable, onAdded, initialPosition }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const payload = { comment };
      if (initialPosition) payload.position = initialPosition;
      
      const { data } = await api.post(`/deliverables/${deliverable._id}/feedback`, payload);
      addToast('Feedback added!', 'success');
      onAdded?.(data.data);
      setComment('');
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to post feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Review Feedback">
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Reviewing: <span className="font-semibold text-slate-700 dark:text-slate-200">{deliverable?.title || 'Selected deliverable'}</span>
        </p>
        <textarea
          className="input-field resize-none"
          rows={4}
          placeholder="Share what should change, what is approved, or any context the design team needs..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
          autoFocus
        />
        <p className="text-xs text-slate-400">Tip: Press Ctrl+Enter or Command+Enter to submit quickly.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={submitting} disabled={!comment.trim()}>Send Feedback</Button>
        </div>
      </div>
    </Modal>
  );
}
