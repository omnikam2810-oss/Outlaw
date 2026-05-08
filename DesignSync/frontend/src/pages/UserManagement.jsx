import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Edit2, Trash2, Check, X, UserPlus, Eye, Camera } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { PageHeader } from '../components/ui/PageHeader';
import api from '../api/axios';
import { useToast } from '../components/ui/useToast';
import { useAuth } from '../context/useAuth';

const ROLES = ['admin', 'designer', 'enterprise_client', 'academy_student'];
const ADMIN_CREATABLE_ROLES = ['designer', 'enterprise_client', 'academy_student'];

const ROLE_BADGE = {
  admin: 'success',
  designer: 'primary',
  enterprise_client: 'warning',
  academy_student: 'secondary',
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [creating, setCreating] = useState(false);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const [createPhoto, setCreatePhoto] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'designer',
    companyName: '',
  });
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const loadInitial = async () => {
      try {
        const { data } = await api.get('/users');
        if (active) setUsers(data.data || []);
      } catch {
        if (active) setUsers([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitial();
    return () => { active = false; };
  }, []);

  const saveRole = async (id) => {
    try {
      await api.put(`/users/${id}`, { role: editRole });
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role: editRole } : u));
      addToast('Role updated', 'success');
    } catch {
      addToast('Failed to update role', 'error');
    } finally {
      setEditingId(null);
    }
  };

  const uploadPhoto = async (targetUser, file) => {
    if (!file) return targetUser;
    if (!file.type.startsWith('image/')) {
      addToast('Please choose an image file for the profile photo', 'error');
      return targetUser;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingPhotoId(targetUser._id);
    try {
      const { data } = await api.put(`/users/${targetUser._id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUsers((prev) => prev.map((u) => u._id === targetUser._id ? data.data : u));
      addToast('Profile photo updated', 'success');
      return data.data;
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.message || 'Failed to update profile photo', 'error');
      return targetUser;
    } finally {
      setUploadingPhotoId(null);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const payload = {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
        companyName: createForm.companyName.trim(),
      };
      const { data } = await api.post('/users', payload);
      const createdUser = createPhoto ? await uploadPhoto(data.data, createPhoto) : data.data;
      setUsers((prev) => [createdUser, ...prev.filter((u) => u._id !== createdUser._id)]);
      setCreateForm({ name: '', email: '', password: '', role: 'designer', companyName: '' });
      setCreatePhoto(null);
      addToast('User ID created successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setCreating(false);
    }
  };

  const deleteUser = async (targetUser) => {
    if (targetUser._id === currentUser?.id || targetUser._id === currentUser?._id) {
      addToast('You cannot delete your own account while signed in', 'error');
      return;
    }
    if (!window.confirm(`Permanently delete ${targetUser.name || targetUser.email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${targetUser._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
      addToast('User permanently deleted', 'success');
    } catch {
      addToast('Failed to delete user', 'error');
    }
  };

  const openUserDetails = (targetUser) => {
    navigate(`/admin/users/${targetUser._id}`, { state: { user: targetUser } });
  };

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Identity administration"
        icon={Users}
        title="User Management"
        description={`${users.length} total users. Designers and clients are created here by admin only.`}
      />

      <form onSubmit={createUser} className="layout-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-indigo-500" />
          <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">Create login ID</h2>
            <p className="text-xs text-slate-500">Share this email and password with the designer or client after creating the account.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            type="text"
            required
            placeholder="Full name"
            className="input-field"
            value={createForm.name}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="email"
            required
            placeholder="Login email"
            className="input-field"
            value={createForm.email}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            className="input-field"
            value={createForm.password}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          <select
            className="input-field"
            value={createForm.role}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
          >
            {ADMIN_CREATABLE_ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
          <input
            type="text"
            placeholder="Company name"
            className="input-field"
            value={createForm.companyName}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, companyName: e.target.value }))}
          />
          <label className="input-field flex cursor-pointer items-center gap-2 text-slate-500">
            <Camera className="h-4 w-4 shrink-0" />
            <span className="truncate">{createPhoto?.name || 'Profile photo'}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setCreatePhoto(e.target.files?.[0] || null)}
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" isLoading={creating}>
            Create ID
          </Button>
        </div>
      </form>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          className="input-field pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="table-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/5">
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Role</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Joined</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-5 py-4">
                      <div className="h-10 skeleton rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={u._id}
                    onClick={() => openUserDetails(u)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openUserDetails(u);
                      }
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar} fallback={u.name} size="8" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {editingId === u._id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs bg-white dark:bg-slate-800 border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            disabled={u.role === 'admin'}
                          >
                            {(u.role === 'admin' ? ['admin'] : ROLES.filter((r) => r !== 'admin')).map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                          </select>
                          <button onClick={(e) => { e.stopPropagation(); saveRole(u._id); }} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg" aria-label="Save">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg" aria-label="Cancel">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <Badge variant={ROLE_BADGE[u.role] || 'secondary'} className="capitalize text-xs">
                          {u.role?.replace('_', ' ')}
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); openUserDetails(u); }}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                          aria-label={`View details for ${u.name || u.email}`}
                          title="View user details"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </button>
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                          title="Change profile photo"
                          aria-label={`Change profile photo for ${u.name || u.email}`}
                        >
                          <Camera className="h-4 w-4" />
                          {uploadingPhotoId === u._id ? 'Uploading...' : 'Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            disabled={uploadingPhotoId === u._id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              uploadPhoto(u, file);
                            }}
                          />
                        </label>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingId(u._id); setEditRole(u.role); }}
                          disabled={editingId === u._id || u.role === 'admin'}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors disabled:opacity-30"
                          aria-label="Edit role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteUser(u); }}
                          disabled={u.role === 'admin' || u._id === currentUser?.id || u._id === currentUser?._id}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Delete user permanently"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
