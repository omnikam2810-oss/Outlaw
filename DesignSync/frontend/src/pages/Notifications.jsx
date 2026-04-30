import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, MessageSquare, Info, Check, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../api/axios';
import { useToast } from '../components/ui/useToast';
import socket from '../api/socket';
import { useNavigate } from 'react-router-dom';

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ICON_MAP = {
  success: { icon: CheckCircle, bg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' },
  message: { icon: MessageSquare, bg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' },
  info: { icon: Info, bg: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30' },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data.data || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };
    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, []);

  const markAll = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      addToast('All notifications marked as read', 'success');
    } catch {
      addToast('Failed to update notifications', 'error');
    }
  };

  const markOne = async (notification) => {
    try {
      await api.patch(`/notifications/${notification._id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === notification._id ? { ...n, isRead: true } : n));
      if (notification.link) navigate(notification.link);
    } catch { /* silent */ }
  };

  const clearAll = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm('Clear all notifications? This cannot be undone.')) return;

    try {
      await api.delete('/notifications');
      setNotifications([]);
      addToast('Notifications cleared', 'success');
    } catch {
      addToast('Failed to clear notifications', 'error');
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-500" />
            Notifications
          </h1>
          {unread > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={markAll} disabled={unread === 0}>
            <Check className="w-4 h-4 mr-1" /> Mark all as read
          </Button>
          <Button variant="danger" size="sm" onClick={clearAll} disabled={notifications.length === 0}>
            <Trash2 className="w-4 h-4 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const config = ICON_MAP[n.type] || ICON_MAP.info;
            const Icon = config.icon;
            return (
              <button
                key={n._id}
                onClick={() => markOne(n)}
                className={`layout-card p-4 flex gap-4 items-start w-full text-left hover:shadow-md transition-shadow ${!n.isRead ? 'border-indigo-400 dark:border-indigo-600 border-l-4' : ''}`}
              >
                <div className={`p-2 rounded-full mt-0.5 shrink-0 ${config.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-slate-800 dark:text-slate-200' : 'font-normal text-slate-600 dark:text-slate-400'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-2 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
