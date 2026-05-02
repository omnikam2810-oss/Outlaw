import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarDays, Mail, Shield, UserRound } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
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
  const [error, setError] = useState('');

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

  const detailItems = [
    { icon: Mail, label: 'Email', value: user.email || '-' },
    { icon: Shield, label: 'Role', value: user.role?.replace('_', ' ') || '-' },
    { icon: Building2, label: 'Company', value: user.companyName || '-' },
    { icon: CalendarDays, label: 'Joined', value: formatDate(user.createdAt) },
    { icon: CalendarDays, label: 'Last updated', value: formatDate(user.updatedAt) },
    { icon: UserRound, label: 'Status', value: user.isActive === false ? 'Inactive' : 'Active' },
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
          <Badge variant={ROLE_BADGE[user.role] || 'secondary'} className="capitalize w-fit">
            {user.role?.replace('_', ' ') || 'user'}
          </Badge>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {detailItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
              <p className="mt-2 text-sm font-medium capitalize text-slate-900 dark:text-slate-100 break-words">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
