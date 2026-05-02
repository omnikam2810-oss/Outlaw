import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../context/useTheme';
import { Menu, Bell, Sun, Moon, CheckCircle, MessageSquare, Info, Trash2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import api from '../../api/axios';
import socket from '../../api/socket';

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ICON_MAP = {
  success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  message: <MessageSquare className="w-4 h-4 text-indigo-500" />,
  info: <Info className="w-4 h-4 text-sky-500" />,
};

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    let active = true;
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications');
        if (active) setNotifications(data.data || []);
      } catch { /* silent */ }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev.filter((n) => n._id !== notification._id)]);
    };

    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const clearNotifications = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm('Clear all notifications?')) return;

    try {
      await api.delete('/notifications');
      setNotifications([]);
      setBellOpen(false);
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const topFive = notifications.slice(0, 5);

  return (
    <nav className="h-16 border-b border-white/70 dark:border-white/10 bg-white/70 dark:bg-[#0b111a]/90 backdrop-blur-2xl sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 shadow-sm shadow-slate-900/5">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="md:hidden p-2 text-slate-600 hover:bg-white/80 rounded-lg dark:text-slate-300 dark:hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="p-2 text-slate-600 hover:bg-white/80 hover:shadow-sm rounded-lg dark:text-slate-300 dark:hover:bg-white/10 transition-all"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notification Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen((o) => !o)}
            aria-label="Notifications"
            className="relative p-2 text-slate-600 hover:bg-white/80 hover:shadow-sm rounded-lg dark:text-slate-300 dark:hover:bg-white/10 transition-all"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[9px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white/95 dark:bg-[#101722]/95 border border-white/70 dark:border-white/10 rounded-lg shadow-2xl shadow-slate-900/20 overflow-hidden z-50 backdrop-blur-2xl">
              <div className="px-4 py-3 border-b border-slate-200/70 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-white/5">
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">Notifications</p>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                      Mark read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                      aria-label="Clear notifications"
                      title="Clear notifications"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {topFive.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">All caught up.</p>
                ) : (
                  topFive.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => { markOneRead(n._id); setBellOpen(false); navigate(n.link || '/notifications'); }}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${!n.isRead ? 'bg-teal-50/60 dark:bg-teal-500/10' : ''}`}
                    >
                      <span className="mt-0.5">{ICON_MAP[n.type] || ICON_MAP.info}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-relaxed ${!n.isRead ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                          {n.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-200/70 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
                <button
                  onClick={() => { setBellOpen(false); navigate('/notifications'); }}
                  className="w-full text-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1 hover:bg-white/70 dark:hover:bg-white/5 transition-all ml-1 text-left"
          aria-label="Open profile"
          title="Open profile"
        >
          <Avatar src={user?.avatar} fallback={user?.name || 'User'} size="8" />
          <div className="hidden sm:block text-sm">
            <p className="font-semibold text-slate-700 dark:text-slate-200 leading-tight">{user?.name || 'Loading...'}</p>
            <p className="text-slate-500 text-xs hidden lg:block capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
