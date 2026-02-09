import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import CenterCard from '../components/CenterCard';
import PillInput from '../components/PillInput';

const EmailSignInScreen: React.FC = () => {
  const navigate = useNavigate();
  const { sendMagicLink, loading, sessionError, clearSessionError } = useAuth();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const emailError = useMemo(() => {
    if (localError) return localError;
    return sessionError;
  }, [localError, sessionError]);

  const validate = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleSend = async () => {
    clearSessionError();
    setLocalError(null);
    const normalized = email.trim().toLowerCase();
    if (!validate(normalized)) {
      setLocalError('Invalid email address.');
      return;
    }
    await sendMagicLink(normalized);
    navigate('/auth/login/email/sent', { state: { email: normalized } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4">
      <CenterCard>
        <h1 className="text-2xl font-semibold text-text-primary">Sign in with email</h1>
        <p className="mt-1 text-sm text-text-secondary">No password required.</p>

        <div className="mt-5">
          <PillInput
            id="email"
            type="email"
            value={email}
            placeholder="you@example.com"
            autoFocus
            onChange={setEmail}
            errorText={emailError}
          />
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button type="button" className="btn-primary flex-1" disabled={loading} onClick={handleSend}>
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => navigate('/auth/login')}>
            Back
          </button>
        </div>
      </CenterCard>
    </div>
  );
};

export default EmailSignInScreen;
