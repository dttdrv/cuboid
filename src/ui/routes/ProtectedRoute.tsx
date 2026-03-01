import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import LoadingScreen from '../components/LoadingScreen';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, requiresUnlock } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiresUnlock) {
    return <Navigate to="/auth/unlock" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
