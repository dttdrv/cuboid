import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import LoadingScreen from '../components/LoadingScreen';

const WorkspaceRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedWorkspaceId, workspaces, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (workspaces.length === 0) return <Navigate to="/workspaces/new" replace />;
  if (workspaces.length > 1 && !selectedWorkspaceId) {
    return <Navigate to="/workspaces/select" replace />;
  }

  return <>{children}</>;
};

export default WorkspaceRoute;
