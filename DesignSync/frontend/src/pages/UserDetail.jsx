import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarDays, Camera, Mail, Shield, Trash2 } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/useToast';
import api from '../api/axios';

const ROLE_BADGE = {
  admin: 'success',
  designer: 'primary',
  enterprise_client: 'warning',
  academy_student: 'secondary',
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null);
  const [loading, setLoading] = useState(!location.state?.user);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/users/${id}`);
        if (active) {
          setUser(data.data);
          setError('');
        }
      } catch {
        if (active) setError('User details could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUser();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-36 skeleton rounded-lg" />
        <div className="layout-card p-6">
          <div className="h-20 skeleton rounded-lg" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="h-24 skeleton rounded-lg" />
            <div className="h-24 skeleton rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-5">
        <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to users
        </Button>
        <div className="layout-card p-8 text-center">
          <p className="font-semibold text-slate-900 dark:text-white">{error || 'User not found.'}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Return to user management and choose another account.</p>
        </div>
      </div>
    );
  }

  const uploadPhoto = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Please choose an image file for the profile photo', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setPhotoSaving(true);
      const { data } = await api.put(`/users/${id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(data.data);
      addToast('Profile photo updated', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.message || 'Failed to update profile photo', 'error');
    } finally {
      setPhotoSaving(false);
    }
  };

  const removePhoto = async () => {
    try {
      setPhotoSaving(true);
      const { data } = await api.put(`/users/${id}`, { avatar: null });
      setUser(data.data);
      addToast('Profile photo removed', 'success');
    } catch {
      addToast('Failed to remove profile photo', 'error');
    } finally {
      setPhotoSaving(false);
    }
  };

  const detailItems = [
    { icon: Mail, label: 'Email', value: user.email || '-' },
    { icon: Shield, label: 'Role', value: user.role?.replace('_', ' ') || '-', valueClassName: 'capitalize' },
    { icon: Building2, label: 'Company', value: user.companyName || '-' },
    { icon: CalendarDays, label: 'Joined', value: formatDate(user.createdAt) },
    { icon: CalendarDays, label: 'Last updated', value: formatDate(user.updatedAt) },
  ];

  return (
    <div className="space-y-6">
      <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to users
      </Button>

      <div className="layout-card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar src={user.avatar} fallback={user.name || user.email || 'User'} size="10" className="h-16 w-16" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">{user.name || 'Unnamed user'}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              <Camera className="h-4 w-4" />
              {photoSaving ? 'Uploading...' : 'Change photo'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={photoSaving}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  uploadPhoto(file);
                }}
              />
            </label>
            {user.avatar && (
              <Button type="button" variant="secondary" onClick={removePhoto} disabled={photoSaving}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove photo
              </Button>
            )}
            <Badge variant={ROLE_BADGE[user.role] || 'secondary'} className="capitalize w-fit">
              {user.role?.replace('_', ' ') || 'user'}
            </Badge>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {detailItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
              <p className={`mt-2 text-sm font-medium text-slate-900 dark:text-slate-100 break-words ${item.valueClassName || ''}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
