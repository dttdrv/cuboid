import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import LoadingScreen from '../components/LoadingScreen';

const RedirectToWorkspaceProjects: React.FC = () => {
  const { loading, user, selectedWorkspaceId, workspaces, requiresUnlock } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (requiresUnlock) return <Navigate to="/auth/unlock" replace />;
  if (selectedWorkspaceId) return <Navigate to={`/app/${selectedWorkspaceId}/projects`} replace />;
  if (workspaces.length === 1) return <Navigate to={`/app/${workspaces[0].id}/projects`} replace />;
  if (workspaces.length === 0) return <Navigate to="/workspaces/new" replace />;
  return <Navigate to="/workspaces/select" replace />;
};

export default RedirectToWorkspaceProjects;
