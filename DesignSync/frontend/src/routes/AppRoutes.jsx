import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const Login = React.lazy(() => import('../pages/Login'));
const Register = React.lazy(() => import('../pages/Register'));
const AdminDashboard = React.lazy(() => import('../pages/AdminDashboard'));
const StudiosDashboard = React.lazy(() => import('../pages/StudiosDashboard'));
const AcademyDashboard = React.lazy(() => import('../pages/AcademyDashboard'));
const Notifications = React.lazy(() => import('../pages/Notifications'));
const UserManagement = React.lazy(() => import('../pages/UserManagement'));
const UserDetail = React.lazy(() => import('../pages/UserDetail'));
const Settings = React.lazy(() => import('../pages/Settings'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/users/:id" element={<UserDetail />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'designer', 'enterprise_client']} />}>
        <Route path="/studios/*" element={<StudiosDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'designer', 'academy_student']} />}>
        <Route path="/academy/*" element={<AcademyDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
