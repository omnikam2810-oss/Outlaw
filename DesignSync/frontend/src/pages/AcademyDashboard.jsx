import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, Star, Clock, CheckCircle2, RefreshCw, GraduationCap, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import DropZone from '../components/ui/DropZone';
import MentorReviewModal from '../components/studios/MentorReviewModal';
import CreateAssignmentModal from '../components/academy/CreateAssignmentModal';
import { Avatar } from '../components/ui/Avatar';
import { PageHeader } from '../components/ui/PageHeader';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { useToast } from '../components/ui/useToast';

const STATUS_BADGE = {
  pending: { variant: 'secondary', label: 'Pending', icon: Clock },
  submitted: { variant: 'warning', label: 'Submitted', icon: RefreshCw },
  approved: { variant: 'success', label: 'Approved', icon: CheckCircle2 },
  revision_requested: { variant: 'warning', label: 'Revision Needed', icon: RefreshCw },
  needs_revision: { variant: 'warning', label: 'Revision Needed', icon: RefreshCw },
};

function SubmitModal({ isOpen, onClose, assignment, onSubmitted }) {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async () => {
    if (!file) { addToast('Please select a file', 'error'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('notes', notes);
      await api.post(`/assignments/${assignment._id}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      addToast('Assignment submitted successfully!', 'success');
      onSubmitted?.();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.message || err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
      setFile(null);
      setNotes('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Submit: ${assignment?.title}`}>
      <div className="space-y-4">
        <DropZone file={file} setFile={setFile} />
        <div>
          <label className="form-label">Notes to mentor (optional)</label>
          <textarea
            rows={3}
            className="input-field resize-none"
            placeholder="Add any context for your mentor..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={submitting} disabled={!file}>
            <Upload className="w-4 h-4 mr-1" /> Submit Assignment
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const AcademyDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitTarget, setSubmitTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { addToast } = useToast();

  const isStudent = user?.role === 'academy_student';
  const isMentor = user?.role === 'designer' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, sRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/submissions'),
      ]);
      setAssignments(aRes.data.data || []);
      setSubmissions(sRes.data.data || []);
    } catch {
      setAssignments([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitial = async () => {
      try {
        const [aRes, sRes] = await Promise.all([
          api.get('/assignments'),
          api.get('/submissions'),
        ]);
        if (!active) return;
        setAssignments(aRes.data.data || []);
        setSubmissions(sRes.data.data || []);
      } catch {
        if (!active) return;
        setAssignments([]);
        setSubmissions([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitial();
    return () => { active = false; };
  }, []);

  const getSubmissionForAssignment = (assignmentId) =>
    submissions.find((s) => s.assignmentId === assignmentId || s.assignmentId?._id === assignmentId);

  const deleteAssignment = async (assignment) => {
    if (!window.confirm(`Permanently delete "${assignment.title}" and all related submissions/reviews?`)) return;

    setDeletingId(assignment._id);
    try {
      await api.delete(`/assignments/${assignment._id}`);
      setAssignments((prev) => prev.filter((item) => item._id !== assignment._id));
      setSubmissions((prev) => prev.filter((item) => {
        const assignmentId = item.assignmentId?._id || item.assignmentId;
        return assignmentId !== assignment._id;
      }));
      addToast('Academy assignment deleted', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.message || 'Failed to delete assignment', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Academy workspace"
        icon={GraduationCap}
        title="Academy"
        description={isStudent ? 'A focused view for assignments, submissions, and progress.' : 'Review student work and keep learning paths moving.'}
        actions={isMentor && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              + New Assignment
            </Button>
        )}
      />

      <CreateAssignmentModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(newAssignment) => {
          setAssignments([newAssignment, ...assignments]);
          setCreateOpen(false);
        }}
      />

      {/* Assignments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      ) : assignments.length === 0 ? (
        <div className="layout-card py-16 text-center text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No assignments available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assignments.map((a) => {
            const sub = getSubmissionForAssignment(a._id);
            const normalizedStatus = sub?.status === 'needs_revision' ? 'revision_requested' : sub?.status;
            const statusInfo = STATUS_BADGE[normalizedStatus || 'pending'];
            const StatusIcon = statusInfo.icon;

            return (
              <div key={a._id} className="layout-card p-5 space-y-3 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{a.title}</h3>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{a.description}</p>
                  </div>
                  <Badge variant={statusInfo.variant} className="shrink-0 flex items-center gap-1 text-xs">
                    <StatusIcon className="w-3 h-3" /> {statusInfo.label}
                  </Badge>
                </div>

                {a.mentorId && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Avatar src={a.mentorId.avatar} fallback={a.mentorId.name} size="5" />
                    <span>{a.mentorId.name}</span>
                  </div>
                )}

                {normalizedStatus === 'revision_requested' && (
                  <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">Revision requested</p>
                      {sub.latestReview?.rating && (
                        <span className="rounded-md bg-white/70 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                          {sub.latestReview.rating}/5
                        </span>
                      )}
                    </div>
                    {sub.latestReview?.feedback ? (
                      <p className="leading-relaxed">{sub.latestReview.feedback}</p>
                    ) : (
                      <p className="leading-relaxed">Your mentor requested changes. Feedback notes will appear here once available.</p>
                    )}
                    {sub.latestReview?.mentorId?.name && (
                      <p className="text-amber-700/80 dark:text-amber-300/80">From {sub.latestReview.mentorId.name}</p>
                    )}
                  </div>
                )}

                {normalizedStatus === 'approved' && sub?.latestReview && (
                  <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">Mentor feedback</p>
                      {sub.latestReview.rating && (
                        <span className="rounded-md bg-white/70 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                          {sub.latestReview.rating}/5
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed">{sub.latestReview.feedback}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {isStudent && (!sub || normalizedStatus === 'revision_requested') && (
                    <Button size="sm" onClick={() => setSubmitTarget(a)}>
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      {sub ? 'Resubmit' : 'Submit'}
                    </Button>
                  )}
                  {isMentor && sub?.fileUrl && (
                    <Button size="sm" variant="ghost" onClick={() => window.open(sub.fileUrl, '_blank', 'noopener,noreferrer')}>
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Work
                    </Button>
                  )}
                  {isMentor && sub && normalizedStatus === 'submitted' && (
                    <Button size="sm" variant="secondary" onClick={() => setReviewTarget(sub)}>
                      <Star className="w-3.5 h-3.5 mr-1" /> Review
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteAssignment(a)}
                      isLoading={deletingId === a._id}
                      disabled={deletingId === a._id}
                      className="ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {submitTarget && (
        <SubmitModal
          isOpen={!!submitTarget}
          onClose={() => setSubmitTarget(null)}
          assignment={submitTarget}
          onSubmitted={load}
        />
      )}

      {reviewTarget && (
        <MentorReviewModal
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          submission={reviewTarget}
          onReviewed={load}
        />
      )}
    </div>
  );
};

export default AcademyDashboard;
