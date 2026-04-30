import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../api/axios';
import { useToast } from '../ui/useToast';
import confetti from 'canvas-confetti';

export default function MilestoneApprovalCard({ project, onApproved }) {
  const [approving, setApproving] = useState(false);
  const { addToast } = useToast();

  if (!project || project.status !== 'in_review') return null;

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.put(`/projects/${project._id}/status`, { status: 'approved' });
      // Confetti burst!
      confetti({
        particleCount: 160,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
      });
      addToast('Milestone approved! 🎉', 'success');
      onApproved?.('approved');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to approve milestone', 'error');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-amber-900 dark:text-amber-100">Action Required</p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
            <strong>{project.title}</strong> is awaiting your milestone approval.
          </p>
        </div>
      </div>
      <Button
        onClick={handleApprove}
        isLoading={approving}
        className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white border-0 gap-2"
      >
        {!approving && <CheckCircle2 className="w-4 h-4" />}
        Approve
      </Button>
    </div>
  );
}
