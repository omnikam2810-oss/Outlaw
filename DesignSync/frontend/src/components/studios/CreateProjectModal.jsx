import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import api from '../../api/axios';
import { useToast } from '../ui/useToast';
import { useAuth } from '../../context/useAuth';

export default function CreateProjectModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    designerIds: [],
    deadline: ''
  });
  const [clients, setClients] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isOpen) {
      api.get('/users/clients').then(res => {
        setClients(res.data.data);
      }).catch(() => {});

      if (isAdmin) {
        api.get('/users/designers').then(res => {
          setDesigners(res.data.data);
        }).catch(() => {});
      }
    }
  }, [isOpen, isAdmin]);

  const toggleDesigner = (designerId) => {
    setFormData((prev) => {
      const isSelected = prev.designerIds.includes(designerId);
      return {
        ...prev,
        designerIds: isSelected
          ? prev.designerIds.filter((id) => id !== designerId)
          : [...prev.designerIds, designerId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.clientId) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/projects', formData);
      addToast('Project created successfully', 'success');
      onCreated?.(data.data);
      setFormData({ title: '', description: '', clientId: '', designerIds: [], deadline: '' });
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create project', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Project Title</label>
          <input 
            type="text" 
            required 
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description (Optional)</label>
          <textarea 
            rows={2}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Assign Client</label>
          <select 
            required
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={formData.clientId}
            onChange={e => setFormData({ ...formData, clientId: e.target.value })}
          >
            <option value="" disabled>Select a client</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
            ))}
          </select>
        </div>
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium mb-1">Assign Designer</label>
            <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-100 p-2 dark:border-slate-600 dark:bg-slate-800">
              {designers.length === 0 ? (
                <p className="px-1 py-2 text-sm text-slate-500">No designer accounts found.</p>
              ) : designers.map((designer) => (
                <label key={designer._id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white dark:hover:bg-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                    checked={formData.designerIds.includes(designer._id)}
                    onChange={() => toggleDesigner(designer._id)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{designer.name}</span>
                    <span className="block truncate text-xs text-slate-500">{designer.email}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Deadline</label>
          <input 
            type="date"
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={formData.deadline}
            onChange={e => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" isLoading={submitting}>Create Project</Button>
        </div>
      </form>
    </Modal>
  );
}
