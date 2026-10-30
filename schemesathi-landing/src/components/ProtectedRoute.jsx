import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * LoadingSpinner helper for route transitions
 */
const RouteLoading = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    gap: '12px',
    backgroundColor: '#ebf1ec',
    color: '#064e3b'
  }}>
    <i className="fa fa-spinner fa-spin" style={{ fontSize: '28px', color: '#0d9488' }}></i>
    <p style={{ fontWeight: 600, fontSize: '14px' }}>Loading SchemeSathi...</p>
  </div>
);

/**
 * Standard Protected Route Component
 * Redirects to login if user is not authenticated.
 * If user is ADMIN, redirects to /admin.
 */
export const ProtectedRoute = ({ children, allowAdmin = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Citizens stay on user pages; Admins are routed to Admin Portal (unless allowAdmin=true)
  const role = (user?.role || '').toUpperCase();
  if (!allowAdmin && (role === 'ADMIN' || role === 'SUPERADMIN')) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

/**
 * AdminRoute Component
 * Requires authentication AND ADMIN role.
 * Non-admins are routed to citizen /dashboard.
 */
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = (user?.role || '').toUpperCase();
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
