import React, { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import LoadingScreen from '../components/LoadingScreen';

const WorkspaceParamRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, workspaces, selectedWorkspaceId, setSelectedWorkspaceId } = useAuth();
  const { workspaceId } = useParams<{ workspaceId: string }>();

  useEffect(() => {
    if (!workspaceId) return;
    if (selectedWorkspaceId === workspaceId) return;
    if (!workspaces.some((workspace) => workspace.id === workspaceId)) return;
    setSelectedWorkspaceId(workspaceId);
  }, [workspaceId, selectedWorkspaceId, workspaces, setSelectedWorkspaceId]);

  if (loading) return <LoadingScreen />;
  if (!workspaceId) return <Navigate to="/workspaces/select" replace />;
  if (!workspaces.some((workspace) => workspace.id === workspaceId)) {
    return <Navigate to="/auth/denied" replace />;
  }

  return <>{children}</>;
};

export default WorkspaceParamRoute;
