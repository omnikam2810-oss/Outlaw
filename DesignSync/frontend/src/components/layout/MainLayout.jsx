import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const fallbackPath = user?.role === 'admin'
    ? '/admin'
    : user?.role === 'academy_student'
      ? '/academy'
      : '/studios';

  const goBack = () => {
    if (window.history.length > 1 && location.key !== 'default') {
      navigate(-1);
      return;
    }
    navigate(fallbackPath);
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-transparent text-slate-900 dark:text-slate-100">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content shifts right on md+ to accommodate fixed sidebar */}
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300 h-screen overflow-y-auto">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main
          className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"
          // Ensure content is scrollable on mobile when sidebar drawer opens
          onClick={() => isSidebarOpen && setSidebarOpen(false)}
        >
          <div className="fade-in pb-8">
            <button
              type="button"
              onClick={goBack}
              className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-950 hover:shadow-md dark:border-white/[0.08] dark:bg-[#2D3748] dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-[#F9FAFB]"
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
