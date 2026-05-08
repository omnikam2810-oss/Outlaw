import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, UploadCloud, File, Image as ImageIcon, FileText, Archive } from 'lucide-react';

export default function DropZone({ file, setFile }) {
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, [setFile]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    accept: {
      'image/*': ['.jpeg', '.png', '.webp', '.jpg'],
      'image/svg+xml': ['.svg'],
      'application/pdf': ['.pdf'],
      'application/zip': ['.zip'],
      'application/octet-stream': []
    }
  });

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = (type) => {
    if (!type) return <File className="h-8 w-8 text-teal-600" />;
    if (type.includes('image')) return <ImageIcon className="h-8 w-8 text-teal-600" />;
    if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (type.includes('zip')) return <Archive className="h-8 w-8 text-amber-500" />;
    return <File className="h-8 w-8 text-teal-600" />;
  };

  return (
    <div className="space-y-3">
      <div 
        {...getRootProps()} 
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition-all
          ${isDragActive ? 'border-teal-500 bg-teal-50 shadow-inner dark:border-blue-500 dark:bg-blue-500/10' : 'border-slate-300 bg-slate-50/70 hover:border-teal-500 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-blue-500 dark:hover:bg-white/[0.06]'}
        `}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mb-4 h-10 w-10 text-teal-600 dark:text-blue-400" />
        <p className="font-semibold text-slate-800 dark:text-slate-200">Drag files here or click to browse</p>
        <p className="text-sm text-slate-500 mt-2">Images, PDF, ZIP up to 50MB</p>
      </div>

      {fileRejections.length > 0 && (
        <p className="text-sm text-red-500 mt-2">File too large (max 50MB) or invalid type.</p>
      )}

      {file && (
        <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-white/[0.08] rounded-lg bg-slate-50 dark:bg-[#202833]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="shrink-0 p-2 bg-white dark:bg-[#2D3748] rounded-lg shadow-sm">
              {getIcon(file.type)}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={removeFile}
            aria-label="Remove file"
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
          >
             <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
