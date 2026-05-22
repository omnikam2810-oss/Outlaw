import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ListPlus, MessageSquareWarning, Plus, Trash2, Upload, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import DeliverableList from '../components/studios/DeliverableList';
import UploadModal from '../components/studios/UploadModal';
import FeedbackPanel from '../components/studios/FeedbackPanel';
import AddFeedbackModal from '../components/studios/AddFeedbackModal';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { useToast } from '../components/ui/useToast';

function FolderIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}

const STATUS_COLORS = {
  draft: 'secondary',
  in_review: 'warning',
  approved: 'success',
  delivered: 'success',
  completed: 'success',
};

const FEATURE_STATUS_COLORS = {
  open: 'secondary',
  in_progress: 'warning',
  submitted: 'primary',
  approved: 'success',
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [project, setProject] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [activeDeliverableId, setActiveDeliverableId] = useState('');
  const [activeFeatureId, setActiveFeatureId] = useState('');
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [featureFormOpen, setFeatureFormOpen] = useState(false);
  const [featureForm, setFeatureForm] = useState({ title: '', description: '' });
  const [featureSaving, setFeatureSaving] = useState(false);
  const [isFeedbackOpen, setFeedbackOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingPin, setPendingPin] = useState(null);
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projRes, delRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/projects/${id}/deliverables`),
        ]);
        setProject(projRes.data.data);
        setDeliverables(delRes.data.data);
        if (delRes.data.data.length > 0) setActiveDeliverableId(delRes.data.data[0]._id);
      } catch (err) {
        console.error(err);
        setError(err.response?.status === 403 ? 'unauthorized' : 'not_found');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleUploadSuccess = (newDeliverable) => {
    setDeliverables([newDeliverable, ...deliverables]);
    setActiveDeliverableId(newDeliverable._id);
    if (newDeliverable.featureId) {
      setProject((prev) => ({
        ...prev,
        features: prev.features?.map((feature) => feature._id === newDeliverable.featureId ? { ...feature, status: 'submitted' } : feature) || []
      }));
    }
  };

  const addFeature = async (e) => {
    e.preventDefault();
    if (!featureForm.title.trim()) return;

    try {
      setFeatureSaving(true);
      const { data } = await api.post(`/projects/${id}/features`, {
        title: featureForm.title.trim(),
        description: featureForm.description.trim()
      });
      setProject((prev) => ({ ...prev, features: [...(prev.features || []), data.data] }));
      setActiveFeatureId(data.data._id);
      setFeatureForm({ title: '', description: '' });
      setFeatureFormOpen(false);
      addToast('Feature added', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to add feature', 'error');
    } finally {
      setFeatureSaving(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await api.put(`/projects/${id}/status`, { status: newStatus });
      setProject(prev => ({ ...prev, status: newStatus }));
      if (newStatus === 'completed') {
        addToast('Project marked as done', 'success');
        navigate('/studios');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFeature = async (feature, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete feature "${feature.title}" and its linked deliverables?`)) return;

    try {
      await api.delete(`/projects/${id}/features/${feature._id}`);
      setProject((prev) => ({
        ...prev,
        features: prev.features?.filter((item) => item._id !== feature._id) || []
      }));
      setDeliverables((prev) => prev.filter((item) => item.featureId !== feature._id));
      if (activeFeatureId === feature._id) setActiveFeatureId('');
      addToast('Feature deleted', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to delete feature', 'error');
    }
  };

  const deleteProject = async () => {
    if (!window.confirm('Permanently delete this completed project? This removes its deliverables and feedback too.')) return;
    try {
      await api.delete(`/projects/${id}`);
      addToast('Project permanently deleted', 'success');
      navigate('/studios');
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to delete project', 'error');
    }
  };

  const canUpload = user?.role === 'admin' || user?.role === 'designer';
  const canAddFeature = user?.role === 'admin';
  const isClient = user?.role === 'enterprise_client';
  const status = project?.status || 'draft';
  const features = project?.features || [];
  const activeFeature = features.find((feature) => feature._id === activeFeatureId);
  const visibleDeliverables = activeFeatureId
    ? deliverables.filter((deliverable) => deliverable.featureId === activeFeatureId)
    : deliverables;
  const activeDeliverable = visibleDeliverables.find((deliverable) => deliverable._id === activeDeliverableId) || visibleDeliverables[0] || null;
  const canDeleteCompletedProject = user?.role === 'admin' && ['delivered', 'approved', 'completed'].includes(status);
  const deadline = project?.deadline
    ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center">
           <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {error === 'unauthorized' ? 'Access Denied' : 'Project Not Found'}
        </h2>
        <p className="text-slate-500 max-w-sm">
          {error === 'unauthorized' 
            ? "You don't have permission to view this project folder. Please contact an administrator."
            : "The project you are looking for doesn't exist or has been moved."}
        </p>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-white/[0.08] dark:bg-[#202225]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? <div className="h-6 w-48 skeleton" /> : project?.title || `Project ${id}`}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
             <p className="text-sm font-semibold text-slate-500">
               {project?.clientId?.name || 'Unassigned'}
             </p>
             <span className="text-slate-300">•</span>
             <p className="text-xs font-semibold uppercase text-slate-400">
               Due {deadline}
             </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isClient && status === 'delivered' && (
             <>
               <Button size="sm" variant="secondary" onClick={() => updateStatus('in_review')}>
                 <MessageSquareWarning className="w-4 h-4 mr-1" /> Request changes
               </Button>
               <Button size="sm" onClick={() => updateStatus('approved')}>
                 <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
               </Button>
             </>
          )}
          {isClient && status === 'in_review' && (
             <div className="hidden sm:block rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
               Changes requested
             </div>
          )}
          {(user?.role === 'admin' || user?.role === 'designer') && !['delivered', 'approved', 'completed'].includes(status) && (
             <Button size="sm" onClick={() => updateStatus('delivered')}>Mark as Delivered</Button>
          )}
          {user?.role === 'admin' && !['approved', 'completed'].includes(status) && (
             <Button size="sm" variant="secondary" onClick={() => updateStatus('completed')}>Mark as Done</Button>
          )}
          {canDeleteCompletedProject && (
            <Button size="sm" variant="danger" onClick={deleteProject}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete Project
            </Button>
          )}
          <Badge variant={STATUS_COLORS[status] || 'default'} className="ml-2">
            {status.replace('_', ' ')}
          </Badge>
        </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid min-h-[calc(100vh-15rem)] gap-5 xl:grid-cols-[440px_minmax(0,1fr)]">
        {/* Left Panel - Deliverables */}
        <aside className="flex min-h-0 flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#202225] xl:max-h-[calc(100vh-15rem)] xl:overflow-y-auto">
          {isClient && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/[0.08] dark:bg-[#2D3748]">
              <p className="font-semibold text-slate-900 dark:text-white">Client review</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Select a deliverable, add comments, pin feedback on images, then approve or request changes when the project is delivered.
              </p>
            </div>
          )}
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/[0.08] dark:bg-[#2D3748]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <ListPlus className="h-4 w-4 text-teal-700 dark:text-blue-400" />
                Features
              </h2>
              {canAddFeature && (
                <button
                  type="button"
                  onClick={() => setFeatureFormOpen((open) => !open)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Add feature"
                  title="Add feature"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {featureFormOpen && (
              <form onSubmit={addFeature} className="mt-3 space-y-2">
                <input
                  type="text"
                  className="input-field h-9 text-sm"
                  placeholder="Feature name"
                  value={featureForm.title}
                  onChange={(e) => setFeatureForm((prev) => ({ ...prev, title: e.target.value }))}
                />
                <textarea
                  rows={2}
                  className="input-field resize-none text-sm"
                  placeholder="Feature details"
                  value={featureForm.description}
                  onChange={(e) => setFeatureForm((prev) => ({ ...prev, description: e.target.value }))}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => setFeatureFormOpen(false)} disabled={featureSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" isLoading={featureSaving}>
                    Add
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => setActiveFeatureId('')}
                className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                  !activeFeatureId
                    ? 'border-slate-900 bg-white text-slate-950 dark:border-slate-300 dark:bg-white/10 dark:text-white'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]'
                }`}
              >
                All deliverables
              </button>
              {features.length === 0 ? (
                <p className="py-3 text-center text-xs text-slate-400">
                  {canAddFeature ? 'No features added yet.' : 'No admin features added yet.'}
                </p>
              ) : features.map((feature) => (
                <button
                  key={feature._id}
                  type="button"
                  onClick={() => setActiveFeatureId(feature._id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    activeFeatureId === feature._id
                      ? 'border-slate-900 bg-white shadow-sm dark:border-slate-300 dark:bg-white/10'
                      : 'border-slate-200 bg-white/70 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{feature.title}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <Badge variant={FEATURE_STATUS_COLORS[feature.status] || 'secondary'} className="text-[10px]">
                        {feature.status?.replace('_', ' ') || 'open'}
                      </Badge>
                      {canAddFeature && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => deleteFeature(feature, e)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') deleteFeature(feature, e);
                          }}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                          aria-label={`Delete feature ${feature.title}`}
                          title="Delete feature"
                        >
                          <X className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </span>
                  </div>
                  {feature.description && (
                    <p className="mt-1 max-h-8 overflow-hidden text-[11px] leading-4 text-slate-500 dark:text-slate-400">{feature.description}</p>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="flex min-h-[320px] flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
               {activeFeature ? activeFeature.title : 'Deliverables'}
            </h2>
            {canUpload && (
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setUploadOpen(true)}>
                <Upload className="w-3.5 h-3.5 mr-1" /> Respond
              </Button>
            )}
          </div>

          <div className="min-h-0 flex-1">
            {loading ? (
              <div className="space-y-3">
                <div className="h-16 skeleton rounded-lg" />
                <div className="h-16 skeleton rounded-lg" />
                <div className="h-16 skeleton rounded-lg" />
              </div>
            ) : (
              <DeliverableList
                deliverables={visibleDeliverables}
                activeDeliverableId={activeDeliverable?._id}
                onSelect={(deliverable) => setActiveDeliverableId(deliverable._id)}
              />
            )}
          </div>
          </section>
        </aside>

        {/* Right Panel - Viewer & Feedback */}
        <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#202225]">
          {/* File viewer */}
          <div className="relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden bg-slate-50 p-5 dark:bg-[#1F2937] sm:p-8">
            {activeDeliverable ? (
              <div className="relative flex h-full min-h-[360px] w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#2D3748]">
                {activeDeliverable.type?.includes('image') ? (
                  <>
                    <img
                      src={activeDeliverable.fileUrl}
                      alt={activeDeliverable.title}
                      className="block h-full w-full object-contain cursor-crosshair"
                      onClick={(e) => {
                        const rect = e.target.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        setPendingPin({ x, y });
                        setFeedbackOpen(true);
                      }}
                    />
                    {/* Render Pending Pin */}
                    {pendingPin && (
                      <div 
                        className="absolute w-5 h-5 bg-slate-900 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
                      />
                    )}
                    {/* Render Existing Pins */}
                    {threads.map((t, idx) => t.position && t.status !== 'resolved' && (
                      <div 
                        key={t._id}
                        className="absolute flex items-center justify-center w-5 h-5 bg-slate-900 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
                        style={{ left: `${t.position.x}%`, top: `${t.position.y}%` }}
                        onClick={() => document.getElementById(`feedback-thread-${t._id}`)?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center space-y-4 p-12 w-full max-w-md">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto">
                       <FolderIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{activeDeliverable.title}</p>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-tight font-medium">{activeDeliverable.type || 'Document'}</p>
                    </div>
                    <Button variant="secondary" className="w-full" asChild>
                      <a href={activeDeliverable.fileUrl} target="_blank" rel="noopener noreferrer">
                        Download to view
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-slate-700">
                   <FolderIcon className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                </div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Select an asset to preview</p>
              </div>
            )}
          </div>

          {/* Live Feedback Panel */}
          <div className="border-t border-slate-200 dark:border-white/[0.08]">
            <FeedbackPanel
              deliverable={activeDeliverable}
              threads={threads}
              setThreads={setThreads}
              onAddFeedback={() => { setPendingPin(null); setFeedbackOpen(true); }}
            />
          </div>
        </section>
      </div>

      <UploadModal
        key={activeFeatureId || 'general'}
        isOpen={isUploadOpen}
        onClose={() => setUploadOpen(false)}
        projectId={id}
        features={features}
        selectedFeatureId={activeFeatureId}
        onUploadSuccess={handleUploadSuccess}
      />

      {activeDeliverable && (
        <AddFeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => { setFeedbackOpen(false); setPendingPin(null); }}
          deliverable={activeDeliverable}
          initialPosition={pendingPin}
          onAdded={(thread) => setThreads((prev) => [thread, ...prev])}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
