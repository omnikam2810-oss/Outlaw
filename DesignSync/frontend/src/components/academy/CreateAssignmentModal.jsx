import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import api from '../../api/axios';
import { useToast } from '../ui/useToast';

export default function CreateAssignmentModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/assignments', formData);
      addToast('Assignment created successfully', 'success');
      onCreated?.(data.data);
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create assignment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Assignment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Assignment Title</label>
          <input 
            type="text" 
            required 
            className="input-field"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label">Description & Requirements</label>
          <textarea 
            required
            rows={4}
            className="input-field resize-none"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label">Deadline (Optional)</label>
          <input 
            type="date"
            className="input-field"
            value={formData.deadline}
            onChange={e => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" isLoading={submitting}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}
