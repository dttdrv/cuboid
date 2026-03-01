import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import LoadingScreen from '../components/LoadingScreen';

const RedirectLegacyEditor: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { loading, selectedWorkspaceId, workspaces, requiresUnlock } = useAuth();
  if (loading) return <LoadingScreen />;
  if (requiresUnlock) return <Navigate to="/auth/unlock" replace />;
  const workspaceId = selectedWorkspaceId || workspaces[0]?.id;
  if (!workspaceId) return <Navigate to="/workspaces/select" replace />;
  if (!projectId) return <Navigate to={`/app/${workspaceId}/projects`} replace />;
  return <Navigate to={`/app/${workspaceId}/projects/${projectId}/editor`} replace />;
};

export default RedirectLegacyEditor;
