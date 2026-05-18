import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Layout from './components/Layout';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Tasks from './pages/Tasks';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import Reports from './pages/Reports';

const PrivateRoute = ({ children, managerOnly }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0d0d1a' }}>
      <div style={{ color: '#e94560', fontSize: 24 }}>Loading TaskFlow...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (managerOnly && user.role !== 'manager') return <Navigate to="/dashboard" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard" element={
          user?.role === 'manager' ? <ManagerDashboard /> : <EmployeeDashboard />
        } />
        <Route path="tasks" element={<Tasks />} />
        <Route path="employees" element={<PrivateRoute managerOnly><Employees /></PrivateRoute>} />
        <Route path="employees/:id" element={<PrivateRoute managerOnly><EmployeeDetail /></PrivateRoute>} />
        <Route path="reports" element={<PrivateRoute managerOnly><Reports /></PrivateRoute>} />
        <Route index element={<Navigate to="/dashboard" />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          theme="dark"
          toastStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', color: '#e8e8f0' }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
