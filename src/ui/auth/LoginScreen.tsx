import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import AuthProviderButton from '../components/AuthProviderButton';
import CenterCard from '../components/CenterCard';
import InlineNotice from '../components/InlineNotice';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithProvider, signInAsAdmin, loading, sessionError, clearSessionError } = useAuth();
  const [pendingProvider, setPendingProvider] = useState<'openai' | 'github' | 'google' | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const handleProvider = async (provider: 'openai' | 'github' | 'google') => {
    clearSessionError();
    setPendingProvider(provider);
    try {
      await signInWithProvider(provider);
      const nextPath = (location.state as { next?: string } | undefined)?.next;
      navigate(nextPath || '/workspaces/select');
    } finally {
      setPendingProvider(null);
    }
  };

  const handleAdminMode = async () => {
    clearSessionError();
    setAdminLoading(true);
    try {
      await signInAsAdmin();
      const nextPath = (location.state as { next?: string } | undefined)?.next;
      navigate(nextPath || '/workspaces/select');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4">
      <CenterCard>
        <div className="mb-7">
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Prism</h1>
            <span className="badge-neutral">Preview</span>
          </div>
          <p className="text-sm text-text-secondary">AI-assisted LaTeX editor</p>
        </div>

        <div className="space-y-3">
          <InlineNotice type="error" message={sessionError} />
          <AuthProviderButton
            provider="openai"
            variant="primary"
            loading={pendingProvider === 'openai'}
            disabled={loading && pendingProvider !== 'openai'}
            onClick={() => handleProvider('openai')}
          />
          <AuthProviderButton
            provider="github"
            variant="secondary"
            loading={pendingProvider === 'github'}
            disabled={loading && pendingProvider !== 'github'}
            onClick={() => handleProvider('github')}
          />
          <AuthProviderButton
            provider="google"
            variant="secondary"
            loading={pendingProvider === 'google'}
            disabled={loading && pendingProvider !== 'google'}
            onClick={() => handleProvider('google')}
          />
        </div>

        <div className="my-5 text-center text-xs text-text-muted">or</div>

        <div className="text-center">
          <button
            type="button"
            className="btn-ghost h-9"
            onClick={() => navigate('/auth/login/email')}
          >
            Sign in with email
          </button>
        </div>

        <div className="mt-3 border-t border-white/[0.08] pt-3 text-center">
          <button
            type="button"
            className="btn-secondary h-9 w-full"
            onClick={handleAdminMode}
            disabled={loading || adminLoading}
          >
            {adminLoading ? 'Entering Admin Mode...' : 'Enter Admin Mode'}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted">
          By continuing, you agree to Terms and Privacy.
        </p>
      </CenterCard>
    </div>
  );
};

export default LoginScreen;
