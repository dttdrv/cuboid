import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import CenterCard from '../components/CenterCard';
import InlineNotice from '../components/InlineNotice';

const CheckInboxScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendMagicLink, completeMagicLink, loading, sessionError } = useAuth();
  const [cooldown, setCooldown] = useState(30);
  const [status, setStatus] = useState<string | null>(null);
  const email = useMemo(
    () => ((location.state as { email?: string } | undefined)?.email || '').toLowerCase(),
    [location.state]
  );

  useEffect(() => {
    if (!email) {
      navigate('/auth/login/email', { replace: true });
      return;
    }
    const timer = setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    await sendMagicLink(email);
    setCooldown(30);
    setStatus('Link sent again.');
  };

  const handleComplete = async () => {
    if (!email) return;
    await completeMagicLink(email);
    navigate('/workspaces/select');
  };

  if (!email) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4">
      <CenterCard>
        <h1 className="text-2xl font-semibold text-text-primary">Check your inbox</h1>
        <p className="mt-1 text-sm text-text-secondary">We sent a sign-in link to {email}.</p>
        <p className="mt-2 text-xs text-text-muted">Didn&apos;t receive it? Check spam.</p>

        <div className="mt-6 space-y-2">
          <InlineNotice type="success" message={status} />
          <InlineNotice type="error" message={sessionError} />
          <button type="button" className="btn-pill-secondary w-full" onClick={handleResend} disabled={cooldown > 0 || loading}>
            {cooldown > 0 ? `Resend link (${cooldown}s)` : 'Resend link'}
          </button>
          <button type="button" className="btn-pill-primary w-full" onClick={handleComplete} disabled={loading}>
            Complete sign-in
          </button>
          <button type="button" className="btn-pill-tertiary w-full" onClick={() => navigate('/auth/login/email')}>
            Use a different email
          </button>
        </div>
      </CenterCard>
    </div>
  );
};

export default CheckInboxScreen;
