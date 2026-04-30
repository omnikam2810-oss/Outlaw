import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Folder, BookOpen, Bell, Settings, LogOut, X, Users, Layers3 } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

const MENU_CONFIG = {
  admin: [
    { id: 'admin', icon: LayoutDashboard, label: 'Admin Dashboard', to: '/admin' },
    { id: 'users', icon: Users, label: 'User Management', to: '/admin/users' },
    { id: 'studios', icon: Folder, label: 'Studios', to: '/studios' },
    { id: 'academy', icon: BookOpen, label: 'Academy', to: '/academy' },
    { id: 'notifications', icon: Bell, label: 'Notifications', to: '/notifications' },
    { id: 'settings', icon: Settings, label: 'Settings', to: '/settings' },
  ],
  designer: [
    { id: 'studios', icon: Folder, label: 'Studios', to: '/studios' },
    { id: 'academy', icon: BookOpen, label: 'Academy', to: '/academy' },
    { id: 'notifications', icon: Bell, label: 'Notifications', to: '/notifications' },
    { id: 'settings', icon: Settings, label: 'Settings', to: '/settings' },
  ],
  enterprise_client: [
    { id: 'studios', icon: Folder, label: 'Client Review', to: '/studios' },
    { id: 'notifications', icon: Bell, label: 'Notifications', to: '/notifications' },
    { id: 'settings', icon: Settings, label: 'Settings', to: '/settings' },
  ],
  academy_student: [
    { id: 'academy', icon: BookOpen, label: 'Academy', to: '/academy' },
    { id: 'notifications', icon: Bell, label: 'Notifications', to: '/notifications' },
    { id: 'settings', icon: Settings, label: 'Settings', to: '/settings' },
  ]
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  
  const role = user?.role;
  const links = role && MENU_CONFIG[role] ? MENU_CONFIG[role] : [];
  const roleLabel = role?.replace('_', ' ') || 'workspace';

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/50 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 overflow-hidden bg-white/90 dark:bg-[#0b111a]/90 border-r border-white/70 dark:border-white/10 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_20%_0%,rgba(20,184,166,0.18),transparent_18rem),radial-gradient(circle_at_90%_10%,rgba(245,158,11,0.12),transparent_14rem)] dark:bg-[radial-gradient(circle_at_15%_0%,rgba(20,184,166,0.16),transparent_18rem),radial-gradient(circle_at_85%_5%,rgba(99,102,241,0.18),transparent_16rem)]" />
        <div className="relative h-20 flex items-center justify-between px-5 border-b border-slate-200/70 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center shadow-lg shadow-teal-500/10 ring-1 ring-white/40 dark:ring-white/20">
              <Layers3 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-950 dark:text-white leading-tight">DesignSync</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">Enterprise {roleLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="relative px-5 py-4 border-b border-slate-100/80 dark:border-white/10">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">Workspace</p>
          <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">Design operations, approvals, and academy work in one clean system.</p>
        </div>

        <nav className="relative p-3 space-y-1 overflow-y-auto h-[calc(100vh-13rem)]">
          {links.map((link) => (
            <NavLink
              key={link.id}
              to={link.to}
              end={link.to === '/admin'}
              className={({ isActive }) => 
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-lg shadow-slate-900/12 dark:shadow-black/30' 
                    : 'text-slate-600 hover:bg-white/80 hover:shadow-sm dark:text-slate-400 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-slate-200'
                }`
              }
            >
              <link.icon className="h-4 w-4 transition-transform group-hover:scale-105" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-[#0b111a]/60 backdrop-blur-xl">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200 font-medium transition-colors"
          >
            <LogOut className="h-5 w-5 text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
