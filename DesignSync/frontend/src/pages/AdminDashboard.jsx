import React, { useState, useEffect } from 'react';
import { Users, Folder, BookOpen, Clock, Activity, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, activityRes] = await Promise.all([
          api.get('/admin/metrics'),
          api.get('/admin/recent-activity')
        ]);
        setMetrics(metricsRes.data.data);
        setActivity(activityRes.data.data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="layout-card flex items-center p-4 animate-pulse">
              <div className="p-3 rounded-lg bg-slate-200 dark:bg-slate-700 h-12 w-12"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="layout-card min-h-[300px] animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-4 w-1/4"></div>
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#11151c]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-[#0f131a] dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Enterprise command center
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Monitor workspace health, users, and active delivery across DesignSync.</p>
          </div>
        </div>
      </div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: metrics.totalProjects, icon: Folder, color: 'text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-slate-800' },
          { label: 'Active Clients', value: metrics.activeClients, icon: Users, color: 'text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-900/30' },
          { label: 'Total Users', value: metrics.totalUsers, icon: BookOpen, color: 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/30' },
          { label: 'Active Projects', value: metrics.activeProjects, icon: Clock, color: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30' },
        ].map((stat, i) => (
          <div key={i} className="layout-card p-4">
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{stat.value ?? 0}</h3>
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent Activity */}
      <div className="layout-card min-h-[300px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Recent Activity</h2>
            <p className="text-sm text-slate-500">Latest workspace events and review movement.</p>
          </div>
          <Activity className="h-5 w-5 text-slate-400" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activity.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No recent activity yet.</p>
          ) : activity.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{item.message}</p>
              <span className="ml-auto whitespace-nowrap text-xs text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
