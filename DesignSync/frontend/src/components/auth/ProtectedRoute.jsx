import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import MainLayout from '../layout/MainLayout';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#1F2937]">
        <div className="skeleton w-32 h-32 rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on what they shouldn't access
    // Or just a general unauthorized page
    return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'academy_student' ? '/academy' : '/studios'} replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

export default ProtectedRoute;
