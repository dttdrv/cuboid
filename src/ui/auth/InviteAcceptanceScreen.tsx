import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LocalInvite } from '../../core/storage/local';
import { useAuth } from '../../core/auth/AuthProvider';
import CenterCard from '../components/CenterCard';

interface InviteView {
  token: string;
  workspace_name: string;
  role: 'Owner' | 'Admin' | 'Member';
  inviter: string;
}

const InviteAcceptanceScreen: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { user, setSelectedWorkspaceId, refreshWorkspaces } = useAuth();
  const [invite, setInvite] = useState<InviteView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInvite = async () => {
      const token = params.token;
      if (!token) {
        setError('Invite not found.');
        return;
      }
      const data = await LocalInvite.getInvite(token);
      if (!data) {
        setError('Invite not found.');
        return;
      }
      setInvite({
        token: data.token,
        workspace_name: data.workspace_name,
        role: data.role,
        inviter: data.inviter
      });
    };
    loadInvite();
  }, [params.token]);

  const handleAccept = async () => {
    if (!user || !invite) {
      navigate('/auth/login');
      return;
    }
    const result = await LocalInvite.acceptInvite(invite.token, user.id);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    await refreshWorkspaces();
    const refreshed = await LocalInvite.getInvite(invite.token);
    if (refreshed) {
      await setSelectedWorkspaceId(refreshed.workspace_id);
      navigate(`/app/${refreshed.workspace_id}/projects`);
      return;
    }
    navigate('/workspaces/select');
  };

  const handleDecline = async () => {
    if (!invite) return;
    if (user) {
      await LocalInvite.declineInvite(invite.token, user.id);
    }
    navigate('/auth/denied');
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4">
        <CenterCard>
          <h1 className="text-2xl font-semibold text-text-primary">You&apos;ve been invited</h1>
          <p className="mt-2 text-sm text-danger">{error}</p>
          <button type="button" className="btn-pill-secondary mt-6 w-full" onClick={() => navigate('/auth/denied')}>
            Continue
          </button>
        </CenterCard>
      </div>
    );
  }

  if (!invite) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4">
      <CenterCard>
        <h1 className="text-2xl font-semibold text-text-primary">You&apos;ve been invited</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Workspace: <span className="text-text-primary">{invite.workspace_name}</span>
        </p>
        <p className="mt-1 text-xs text-text-muted">Invited by {invite.inviter}</p>
        <p className="mt-1 text-xs text-text-muted">Permissions: {invite.role}</p>

        {!user ? (
          <button
            type="button"
            className="btn-pill-primary mt-6 w-full"
            onClick={() => navigate('/auth/login', { state: { next: `/auth/invites/${invite.token}` } })}
          >
            Sign in to accept
          </button>
        ) : (
          <div className="mt-6 flex items-center gap-3">
            <button type="button" className="btn-pill-primary flex-1" onClick={handleAccept}>
              Accept invite
            </button>
            <button type="button" className="btn-pill-tertiary" onClick={handleDecline}>
              Decline
            </button>
          </div>
        )}
      </CenterCard>
    </div>
  );
};

export default InviteAcceptanceScreen;
