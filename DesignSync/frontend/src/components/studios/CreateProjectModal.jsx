import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import api from '../../api/axios';
import { useToast } from '../ui/useToast';

export default function CreateProjectModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    deadline: ''
  });
  const [clients, setClients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      api.get('/users/clients').then(res => {
        setClients(res.data.data);
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.clientId) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/projects', formData);
      addToast('Project created successfully', 'success');
      onCreated?.(data.data);
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
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" isLoading={submitting}>Create Project</Button>
        </div>
      </form>
    </Modal>
  );
}
