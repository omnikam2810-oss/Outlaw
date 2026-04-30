import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Moon, Sun, User, Lock } from 'lucide-react';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', {
        name: formData.name
      });
      updateUser(res.data.data);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await api.put('/users/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      toast.success('Password changed');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch {
      toast.error('Failed to change password');
    }
  };

  const themeButtonClass = (value) =>
    `flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
      theme === value
        ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0f131a] dark:text-slate-200 dark:hover:bg-slate-800'
    }`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your profile, security, and workspace theme.</p>
      </div>
      
      {/* Profile Update */}
      <div className="layout-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-950 dark:text-white">
          <User className="h-5 w-5 text-slate-400" /> Profile Information
        </h2>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input-field text-slate-950 dark:text-slate-100 placeholder:text-slate-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              value={formData.email}
              readOnly
              className="input-field cursor-not-allowed bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400 placeholder:text-slate-400"
              required
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Email address is managed by your administrator and cannot be changed here.</p>
          </div>
          <Button type="submit">Update Profile</Button>
        </form>
      </div>

      {/* Password Change */}
      <div className="layout-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-950 dark:text-white">
          <Lock className="h-5 w-5 text-slate-400" /> Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Current Password</label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="input-field text-slate-950 dark:text-slate-100 placeholder:text-slate-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">New Password</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="input-field text-slate-950 dark:text-slate-100 placeholder:text-slate-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Confirm New Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="input-field text-slate-950 dark:text-slate-100 placeholder:text-slate-400"
              required
            />
          </div>
          <Button type="submit">Change Password</Button>
        </form>
      </div>

      {/* Theme Preferences */}
      <div className="layout-card p-6">
        <h2 className="text-lg font-semibold mb-2 text-slate-950 dark:text-white">Theme Preferences</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Choose how DesignSync appears across every module.</p>
        <div className="flex gap-4">
          <button
            onClick={() => theme === 'dark' && toggleTheme()}
            className={themeButtonClass('light')}
          >
            <Sun className="h-4 w-4" />
            Light Mode
          </button>
          <button
            onClick={() => theme === 'light' && toggleTheme()}
            className={themeButtonClass('dark')}
          >
            <Moon className="h-4 w-4" />
            Dark Mode
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
