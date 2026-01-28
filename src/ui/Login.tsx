import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../core/auth/AuthProvider';

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FF9000 0%, #FF5000 100%)', // Mistral Orange
      fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
      padding: '20px',
    },
    card: {
      backgroundColor: 'white',
      width: '100%',
      maxWidth: '400px',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transition: 'transform 0.2s',
    },
    logoBox: {
      width: '56px',
      height: '56px',
      backgroundColor: '#0F172A', // Slate 900
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px',
      color: 'white',
      fontSize: '24px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#0F172A',
      marginBottom: '8px',
      textAlign: 'center',
    },
    subtitle: {
      color: '#64748B', // Slate 500
      fontSize: '14px',
      marginBottom: '24px',
      textAlign: 'center',
    },
    form: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '12px',
      border: '1px solid #E2E8F0', // Slate 200
      backgroundColor: '#F8FAFC', // Slate 50
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#0F172A', // Slate 900
      color: 'white',
      borderRadius: '12px',
      fontWeight: '600',
      fontSize: '14px',
      border: 'none',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1,
      transition: 'background-color 0.2s',
    },
    error: {
      color: '#DC2626',
      fontSize: '13px',
      textAlign: 'center',
      backgroundColor: '#FEF2F2',
      padding: '8px',
      borderRadius: '8px',
    },
    footer: {
      marginTop: '32px',
      fontSize: '12px',
      color: '#94A3B8',
      display: 'flex',
      gap: '8px',
    },
    link: {
      color: '#64748B',
      textDecoration: 'none',
    },
    devMode: {
      marginTop: '16px',
      fontSize: '10px',
      color: 'rgba(124, 45, 18, 0.6)', // Orange-800
      fontFamily: 'monospace',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoBox}>
          🧱
        </div>
        <h1 style={styles.title}>Cuboid</h1>
        <p style={styles.subtitle}>Login or signup below</p>

        {/* Social Mock */}
        <div style={{ width: '100%', display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['Google', 'Microsoft', 'Apple'].map(provider => (
            <button key={provider} disabled style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              background: 'white',
              cursor: 'default',
              opacity: 0.6,
              fontSize: '10px',
              fontWeight: 500
            }}>
              {provider}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            required
            placeholder="name@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
          />

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <a href="#" style={styles.link}>Terms of Service</a>
          <span>•</span>
          <a href="#" style={styles.link}>Privacy Policy</a>
        </div>

        {import.meta.env.DEV && (
          <div style={styles.devMode}>
            DEV MODE: Offline Mock Login Active
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;