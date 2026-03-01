import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const RedirectLegacyInvite: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  if (!token) return <Navigate to="/auth/denied" replace />;
  return <Navigate to={`/auth/invites/${token}`} replace />;
};

export default RedirectLegacyInvite;
