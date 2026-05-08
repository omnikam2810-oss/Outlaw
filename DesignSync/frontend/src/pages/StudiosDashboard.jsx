import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Folder, Plus, BriefcaseBusiness, CalendarDays } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/useAuth';
import ProjectDetail from './ProjectDetail';
import CreateProjectModal from '../components/studios/CreateProjectModal';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isClient = user?.role === 'enterprise_client';

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleProjectCreated = (newProject) => {
    setProjects([newProject, ...projects]);
  };

  if (loading) {
    return (
      <div className="space-y-6">
      <PageHeader
        eyebrow="Studios workspace"
        icon={BriefcaseBusiness}
        title={isClient ? 'Client Review' : 'Studios Projects'}
        description={isClient ? 'Review your assigned projects, inspect deliverables, and send feedback to the design team.' : 'Track client work, milestones, feedback, and approvals with a cleaner enterprise view.'}
        meta={<div className="text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold text-slate-950 dark:text-white">{projects.length}</span> {isClient ? 'review item' : 'active workspace item'}{projects.length === 1 ? '' : 's'}</div>}
      />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="layout-card flex flex-col animate-pulse">
              <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-t-lg -mx-6 -mt-6 mb-4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studios workspace"
        icon={BriefcaseBusiness}
        title={isClient ? 'Client Review' : 'Studios Projects'}
        description={isClient ? 'Open a project to inspect deliverables, pin comments, and approve or request changes.' : 'A focused board for briefs, client reviews, and delivery status.'}
        actions={(
          <>
            <div className="hidden sm:block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-white/[0.08] dark:bg-white/[0.05]">
              <span className="font-semibold text-slate-950 dark:text-white">{projects.length}</span>
              <span className="ml-1 text-slate-500">{isClient ? 'to review' : 'projects'}</span>
            </div>
            {(user?.role === 'admin' || user?.role === 'designer') && (
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> New Project
              </Button>
            )}
          </>
        )}
      />
      
      {projects.length === 0 ? (
        <div className="layout-card py-20 text-center flex flex-col items-center justify-center border-dashed">
          <div className="w-16 h-16 bg-slate-50 dark:bg-[#202833] rounded-full flex items-center justify-center mb-4">
             <Folder className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No active projects</h2>
          <p className="text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            {user?.role === 'enterprise_client' 
              ? "You don't have any projects assigned for review yet. New project work will appear here when your design team assigns it to you."
              : "Start by creating your first project folder to collaborate with clients."}
          </p>
          {(user?.role === 'admin' || user?.role === 'designer') && (
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
               Create Product Folder
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} onClick={() => navigate(`/studios/${project._id}`)} className="layout-card group min-w-0 cursor-pointer p-5">
              <div className="flex items-start justify-between gap-3 text-sm">
                <h3 className="min-w-0 flex-1 truncate font-semibold text-slate-950 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-white transition-colors">
                  {project.title}
                </h3>
                <Badge variant={project.status === 'completed' || project.status === 'approved' ? 'success' : 'warning'} className="shrink-0">
                  {project.status || 'Draft'}
                </Badge>
              </div>

              <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">Client</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{project.clientId?.name || 'Unassigned'}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-1 text-slate-500"><CalendarDays className="h-3.5 w-3.5" /> Due date</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onCreated={handleProjectCreated} 
      />
    </div>
  );
};

const StudiosDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<ProjectList />} />
      <Route path="/:id" element={<ProjectDetail />} />
    </Routes>
  );
};

export default StudiosDashboard;
