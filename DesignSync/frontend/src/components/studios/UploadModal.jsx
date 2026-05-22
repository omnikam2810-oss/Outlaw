import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import DropZone from '../ui/DropZone';
import { Button } from '../ui/Button';
import api from '../../api/axios';
import { useToast } from '../ui/useToast';

export default function UploadModal({ isOpen, onClose, projectId, features = [], selectedFeatureId = '', onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [version, setVersion] = useState('1');
  const [featureId, setFeatureId] = useState(selectedFeatureId || '');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { addToast } = useToast();

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', version);
    formData.append('type', file.type || 'application/octet-stream');
    formData.append('title', file.name);
    if (featureId) formData.append('featureId', featureId);
    if (description.trim()) formData.append('description', description.trim());

    try {
      const { data } = await api.post(`/projects/${projectId}/deliverables`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      
      addToast('File uploaded successfully', 'success');
      onUploadSuccess(data.data);
      handleClose();
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to upload', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    setFile(null);
    setVersion('1');
    setFeatureId(selectedFeatureId || '');
    setDescription('');
    setProgress(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Respond With Deliverable">
      <div className="space-y-4">
        <DropZone file={file} setFile={setFile} />
        
        {file && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Feature</label>
              <select
                className="input-field"
                value={featureId}
                onChange={(e) => setFeatureId(e.target.value)}
              >
                <option value="">General project deliverable</option>
                {features.map((feature) => (
                  <option key={feature._id} value={feature._id}>{feature.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Designer response</label>
              <textarea
                rows={3}
                className="input-field resize-none"
                placeholder="Describe what was delivered for this feature."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Version identifier</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. v2, v3, Initial Draft" 
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>
          </>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Supported uploads: JPG, PNG, WebP, SVG, PDF, ZIP, and common binary design exports up to 50MB.
        </p>

        {uploading && (
          <div className="w-full bg-slate-200 dark:bg-white/[0.08] rounded-full h-2.5 mt-4">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            <p className="text-right text-xs mt-1 text-slate-500 font-medium">{progress}%</p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={handleClose} disabled={uploading}>Cancel</Button>
          <Button onClick={handleUpload} isLoading={uploading} disabled={!file}>
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
