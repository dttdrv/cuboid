import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import CenterCard from '../components/CenterCard';
import WorkspaceRow from '../components/WorkspaceRow';

const WorkspaceSelectScreen: React.FC = () => {
  const navigate = useNavigate();
  const { workspaces, selectedWorkspaceId, setSelectedWorkspaceId, signOut } = useAuth();

  const handleChoose = async (workspaceId: string) => {
    await setSelectedWorkspaceId(workspaceId);
    navigate(`/app/${workspaceId}/projects`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4">
      <CenterCard className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-text-primary">Choose a workspace</h1>
        {workspaces.length > 0 ? (
          <div className="mt-5 space-y-2">
            {workspaces.map((workspace) => (
              <WorkspaceRow
                key={workspace.id}
                workspace={workspace}
                active={workspace.id === selectedWorkspaceId}
                onClick={() => handleChoose(workspace.id)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-text-secondary">No workspace found yet.</p>
        )}
        <div className="mt-6 flex items-center gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={() => navigate('/workspaces/new')}>
            Create new workspace
          </button>
          <button type="button" className="btn-ghost" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </CenterCard>
    </div>
  );
};

export default WorkspaceSelectScreen;
