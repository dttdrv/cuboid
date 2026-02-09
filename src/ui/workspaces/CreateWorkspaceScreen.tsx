import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import { LocalWorkspace } from '../../core/storage/local';
import CenterCard from '../components/CenterCard';
import PillInput from '../components/PillInput';

const CreateWorkspaceScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, setSelectedWorkspaceId, refreshWorkspaces } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'Personal' | 'Team'>('Personal');

  const handleCreate = async () => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Workspace name is required.');
      return;
    }
    const workspace = await LocalWorkspace.createWorkspace(user.id, trimmed, 'Owner');
    await refreshWorkspaces();
    await setSelectedWorkspaceId(workspace.id);
    navigate(`/app/${workspace.id}/projects`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4">
      <CenterCard>
        <h1 className="text-2xl font-semibold text-text-primary">Create workspace</h1>
        <p className="mt-1 text-sm text-text-secondary">Set up your workspace before entering projects.</p>

        <div className="mt-5">
          <PillInput
            id="workspace-name"
            value={name}
            onChange={setName}
            placeholder="Workspace name"
            autoFocus
            errorText={error}
          />
        </div>

        <div className="mt-2 flex rounded-full bg-charcoal-850 p-1">
          <button
            type="button"
            className={`h-9 flex-1 rounded-full text-sm ${type === 'Personal' ? 'bg-charcoal-800 text-text-primary' : 'text-text-secondary'}`}
            onClick={() => setType('Personal')}
          >
            Personal
          </button>
          <button
            type="button"
            className={`h-9 flex-1 rounded-full text-sm ${type === 'Team' ? 'bg-charcoal-800 text-text-primary' : 'text-text-secondary'}`}
            onClick={() => setType('Team')}
          >
            Team
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="button" className="btn-pill-primary flex-1" onClick={handleCreate}>
            Create workspace
          </button>
          <button type="button" className="btn-pill-tertiary" onClick={() => navigate('/workspaces/select')}>
            Back
          </button>
        </div>
      </CenterCard>
    </div>
  );
};

export default CreateWorkspaceScreen;
