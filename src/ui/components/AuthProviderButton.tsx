import React from 'react';

type Provider = 'openai' | 'github' | 'google';

interface AuthProviderButtonProps {
  provider: Provider;
  variant: 'primary' | 'secondary';
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

const labelByProvider: Record<Provider, string> = {
  openai: 'Continue with OpenAI',
  github: 'Continue with GitHub',
  google: 'Continue with Google'
};

const AuthProviderButton: React.FC<AuthProviderButtonProps> = ({
  provider,
  variant,
  loading,
  disabled,
  onClick
}) => {
  const className = variant === 'primary' ? 'btn-pill-primary w-full' : 'btn-pill-secondary w-full';
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? 'Working...' : labelByProvider[provider]}
    </button>
  );
};

export default AuthProviderButton;
