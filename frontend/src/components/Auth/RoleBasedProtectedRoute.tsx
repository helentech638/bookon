import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RoleBasedProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const RoleBasedProtectedRoute: React.FC<RoleBasedProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  redirectTo 
}) => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  console.log('RoleBasedProtectedRoute:', { 
    user, 
    isAuthenticated, 
    isLoading, 
    allowedRoles, 
    location: location.pathname 
  });
  
  // Show loading while checking authentication
  if (isLoading) {
    console.log('RoleBasedProtectedRoute: Loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00806a]"></div>
      </div>
    );
  }
  
  // Check authentication first
  if (!isAuthenticated || !user) {
    console.log('RoleBasedProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Get user role
  const userRole = user.role;
  console.log('RoleBasedProtectedRoute: User role check', { userRole, allowedRoles });
  
  // Check if user has required role
  if (!userRole || !allowedRoles.includes(userRole)) {
    console.log('RoleBasedProtectedRoute: Role not allowed, redirecting to appropriate dashboard');
    // Redirect to appropriate dashboard based on user role
    if (userRole === 'business') {
      return <Navigate to="/business/dashboard" replace />;
    } else if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      // Default to parent dashboard for parent/staff users
      return <Navigate to="/parent/dashboard" replace />;
    }
  }
  
  console.log('RoleBasedProtectedRoute: Access granted');
  return <>{children}</>;
};

export default RoleBasedProtectedRoute;
