import React from 'react';
import { useNavigate } from 'react-router-dom';
import CenterCard from '../components/CenterCard';

const SessionExpiredScreen: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4">
      <CenterCard>
        <h1 className="text-2xl font-semibold text-text-primary">Session expired</h1>
        <p className="mt-1 text-sm text-text-secondary">Please sign in again.</p>
        <div className="mt-6 flex items-center gap-3">
          <button type="button" className="btn-primary flex-1" onClick={() => navigate('/auth/login')}>
            Sign in
          </button>
          <button type="button" className="btn-ghost" onClick={() => navigate('/')}>
            Back to home
          </button>
        </div>
      </CenterCard>
    </div>
  );
};

export default SessionExpiredScreen;
