import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, MessageSquareWarning, Trash2, Upload } from 'lucide-react';
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
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [project, setProject] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [activeDeliverable, setActiveDeliverable] = useState(null);
  const [isUploadOpen, setUploadOpen] = useState(false);
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
        if (delRes.data.data.length > 0) setActiveDeliverable(delRes.data.data[0]);
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
    setActiveDeliverable(newDeliverable);
  };

  const updateStatus = async (newStatus) => {
    try {
      await api.put(`/projects/${id}/status`, { status: newStatus });
      setProject(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error(err);
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
  const isClient = user?.role === 'enterprise_client';
  const status = project?.status || 'draft';
  const canDeleteCompletedProject = user?.role === 'admin' && ['delivered', 'approved'].includes(status);
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
    <div className="h-[calc(100vh-8rem)] flex flex-col -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      {/* Top Bar */}
      <div className="bg-white dark:bg-[#111111] border-b border-slate-200/80 dark:border-slate-800 px-6 py-3 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] sticky top-0 z-10 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {loading ? <div className="h-6 w-48 skeleton" /> : project?.title || `Project ${id}`}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
             <p className="text-xs font-medium text-slate-500">
               {project?.clientId?.name || 'Unassigned'}
             </p>
             <span className="text-slate-300">•</span>
             <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
               Due {deadline}
             </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
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
          {(user?.role === 'admin' || user?.role === 'designer') && status !== 'delivered' && status !== 'approved' && (
             <Button size="sm" onClick={() => updateStatus('delivered')}>Mark as Delivered</Button>
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

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden bg-[#FAFAFA] dark:bg-[#0A0A0A]">
        {/* Left Panel - Deliverables */}
        <div className="w-[380px] border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111111] overflow-y-auto p-5 flex flex-col gap-4">
          {isClient && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-[#0f131a]">
              <p className="font-semibold text-slate-900 dark:text-white">Client review</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Select a deliverable, add comments, pin feedback on images, then approve or request changes when the project is delivered.
              </p>
            </div>
          )}
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
               Deliverables
            </h2>
            {canUpload && (
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setUploadOpen(true)}>
                <Upload className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            )}
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="space-y-3">
                <div className="h-16 skeleton rounded-lg" />
                <div className="h-16 skeleton rounded-lg" />
                <div className="h-16 skeleton rounded-lg" />
              </div>
            ) : (
              <DeliverableList
                deliverables={deliverables}
                activeDeliverableId={activeDeliverable?._id}
                onSelect={setActiveDeliverable}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Viewer & Feedback */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* File viewer */}
          <div className="flex-1 p-12 overflow-auto flex items-center justify-center relative">
            {activeDeliverable ? (
              <div className="relative inline-flex items-center justify-center max-w-full max-h-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {activeDeliverable.type?.includes('image') ? (
                  <>
                    <img
                      src={activeDeliverable.fileUrl}
                      alt={activeDeliverable.title}
                      className="max-w-full max-h-[85vh] object-contain cursor-crosshair"
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
          <FeedbackPanel
            deliverable={activeDeliverable}
            threads={threads}
            setThreads={setThreads}
            onAddFeedback={() => { setPendingPin(null); setFeedbackOpen(true); }}
          />
        </div>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setUploadOpen(false)}
        projectId={id}
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
