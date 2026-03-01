import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import LoadingScreen from '../components/LoadingScreen';

const HomeRoute: React.FC = () => {
  const { user, selectedWorkspaceId, workspaces, loading, requiresUnlock } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (requiresUnlock) return <Navigate to="/auth/unlock" replace />;
  if (workspaces.length === 0) return <Navigate to="/workspaces/new" replace />;
  if (workspaces.length > 1 && !selectedWorkspaceId) return <Navigate to="/workspaces/select" replace />;
  return <Navigate to={`/app/${selectedWorkspaceId || workspaces[0].id}/projects`} replace />;
};

export default HomeRoute;
