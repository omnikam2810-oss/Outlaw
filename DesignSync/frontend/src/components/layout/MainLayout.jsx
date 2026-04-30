import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

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
          <div className="fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
