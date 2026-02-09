import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import CenterCard from '../components/CenterCard';
import PillInput from '../components/PillInput';

const UnlockSessionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, requiresUnlock, unlockSession, loading, sessionError, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth/login', { replace: true });
      return;
    }
    if (!requiresUnlock) {
      navigate('/', { replace: true });
    }
  }, [user, requiresUnlock, navigate]);

  if (!user || !requiresUnlock) return null;

  const handleUnlock = async () => {
    setLocalError(null);
    const candidate = password.trim();
    if (!candidate) {
      setLocalError('Password is required.');
      return;
    }
    try {
      await unlockSession(candidate);
      navigate('/', { replace: true });
    } catch {
      // Error is exposed through sessionError.
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4">
      <CenterCard>
        <h1 className="text-2xl font-semibold text-text-primary">Unlock session</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your local key session is locked. Enter your password to continue.
        </p>
        <div className="mt-5">
          <PillInput
            id="unlock-password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Password"
            autoFocus
            errorText={localError || sessionError}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="button" className="btn-primary flex-1" disabled={loading} onClick={handleUnlock}>
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
          <button type="button" className="btn-ghost" disabled={loading} onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </CenterCard>
    </div>
  );
};

export default UnlockSessionScreen;
