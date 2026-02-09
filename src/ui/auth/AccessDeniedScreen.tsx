import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import CenterCard from '../components/CenterCard';

const AccessDeniedScreen: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4">
      <CenterCard>
        <h1 className="text-2xl font-semibold text-text-primary">You don&apos;t have access</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Request access from a workspace admin, or switch workspace.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button type="button" className="btn-pill-secondary flex-1" onClick={() => navigate('/workspaces/select')}>
            Switch workspace
          </button>
          <button type="button" className="btn-pill-tertiary" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </CenterCard>
    </div>
  );
};

export default AccessDeniedScreen;
