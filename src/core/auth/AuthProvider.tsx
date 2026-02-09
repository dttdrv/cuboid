import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LocalWorkspace } from '../storage/local';
import { deriveMasterKey, toBase64, fromBase64 } from '../crypto';
import { User, Workspace } from '../data/types';
import { getAuthService } from './LocalAuthService';
import { AuthProviderId } from './AuthService';
import {
  clearWrappedMasterKey,
  persistWrappedMasterKey,
  restoreWrappedMasterKey,
} from './masterKeySession';

const MAGIC_LINK_PENDING_STORAGE = 'cuboid_pending_magic_links_v1';
const authService = getAuthService();

const readPendingMagicLinks = (): Record<string, string> => {
  if (typeof window === 'undefined' || !window.sessionStorage) return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(MAGIC_LINK_PENDING_STORAGE) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
};

const writePendingMagicLinks = (value: Record<string, string>) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  window.sessionStorage.setItem(MAGIC_LINK_PENDING_STORAGE, JSON.stringify(value));
};

interface AuthContextType {
  user: User | null;
  masterKey: CryptoKey | null;
  requiresUnlock: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsAdmin: () => Promise<void>;
  signInWithProvider: (provider: 'openai' | 'github' | 'google') => Promise<void>;
  unlockSession: (password: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLink: (email: string, token?: string) => Promise<void>;
  signOut: () => Promise<void>;
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (id: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  sessionError: string | null;
  clearSessionError: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const providerPassword = (provider: AuthProviderId, email: string) => {
  return `provider:${provider}:${email.toLowerCase()}`;
};

const toProviderId = (value: string | undefined): AuthProviderId => {
  if (value === 'openai' || value === 'github' || value === 'google' || value === 'email') {
    return value;
  }
  return 'email';
};

const persistSessionMasterKey = async (userId: string, key: CryptoKey) => {
  const sessionKey = authService.rotateSessionKey('auth-key-issued');
  try {
    await persistWrappedMasterKey(userId, key, sessionKey);
  } catch {
    // Non-fatal: session wrapping is best-effort for local mode.
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [requiresUnlock, setRequiresUnlock] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceIdState] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateWorkspaceState = async (userId: string) => {
    const list = await LocalWorkspace.listWorkspaces(userId);
    setWorkspaces(list);

    const selected = await LocalWorkspace.getSelectedWorkspace();
    if (selected && list.some((workspace) => workspace.id === selected)) {
      setSelectedWorkspaceIdState(selected);
      return;
    }

    if (list.length === 1) {
      await LocalWorkspace.setSelectedWorkspace(list[0].id);
      setSelectedWorkspaceIdState(list[0].id);
      return;
    }

    setSelectedWorkspaceIdState(null);
  };

  const refreshWorkspaces = async () => {
    if (!user) return;
    await hydrateWorkspaceState(user.id);
  };

  const deriveKey = async (authUser: User, password: string): Promise<CryptoKey> => {
    let saltBase64 = await authService.getEncryptionSalt(authUser.id);
    if (!saltBase64) {
      const saltBytes = crypto.getRandomValues(new Uint8Array(16));
      saltBase64 = toBase64(saltBytes);
      await authService.setEncryptionSalt(authUser.id, saltBase64);
    }
    const saltBytes = fromBase64(saltBase64);
    return deriveMasterKey(password, saltBytes);
  };

  const restoreMasterKeyFromSession = async (authUser: User): Promise<boolean> => {
    const sessionKey = authService.readSessionKey();
    if (!sessionKey) {
      const providerId = toProviderId(String(authUser.app_metadata?.provider || 'email').toLowerCase());
      const email = authUser.email?.trim().toLowerCase();
      if (email) {
        const fallbackKey = await deriveKey(authUser, providerPassword(providerId, email));
        setMasterKey(fallbackKey);
        setRequiresUnlock(false);
        await persistSessionMasterKey(authUser.id, fallbackKey);
        return true;
      }
      setRequiresUnlock(true);
      setMasterKey(null);
      return false;
    }

    const restoredKey = await restoreWrappedMasterKey(authUser.id, sessionKey);
    if (!restoredKey) {
      const providerId = toProviderId(String(authUser.app_metadata?.provider || 'email').toLowerCase());
      const email = authUser.email?.trim().toLowerCase();
      if (email) {
        const fallbackKey = await deriveKey(authUser, providerPassword(providerId, email));
        setMasterKey(fallbackKey);
        setRequiresUnlock(false);
        await persistSessionMasterKey(authUser.id, fallbackKey);
        return true;
      }
      setRequiresUnlock(true);
      setMasterKey(null);
      return false;
    }

    setMasterKey(restoredKey);
    setRequiresUnlock(false);
    return true;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { session } = await authService.getSession();
      if (session?.user) {
        setUser(session.user);
        await hydrateWorkspaceState(session.user.id);
        const restored = await restoreMasterKeyFromSession(session.user);
        if (!restored) {
          setSessionError('Session is locked. Unlock or sign in again.');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    return authService.onSessionKeyLifecycle((event) => {
      if (event.type === 'cleared' && user) {
        setMasterKey(null);
        setRequiresUnlock(true);
      }
    });
  }, [user]);

  const signIn = async (
    email: string,
    password: string,
    provider: AuthProviderId = 'email',
  ) => {
    setLoading(true);
    setSessionError(null);
    try {
      const result = await authService.signIn(email, password, provider);
      if ('error' in result) throw result.error;
      const { user: authUser } = result;

      const key = await deriveKey(authUser, password);

      setUser(authUser);
      setMasterKey(key);
      setRequiresUnlock(false);
      await persistSessionMasterKey(authUser.id, key);
      await hydrateWorkspaceState(authUser.id);
    } catch (error) {
      console.error('Error during sign in:', error);
      setSessionError('Sign-in failed. Try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unlockSession = async (password: string) => {
    if (!user) {
      throw new Error('No active session.');
    }
    setSessionError(null);
    setLoading(true);
    try {
      const key = await deriveKey(user, password);
      setMasterKey(key);
      setRequiresUnlock(false);
      await persistSessionMasterKey(user.id, key);
    } catch (error) {
      setSessionError('Unlock failed. Check credentials.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: 'openai' | 'github' | 'google') => {
    const providerEmail = `user+${provider}@prism.local`;
    await signIn(providerEmail, providerPassword(provider, providerEmail), provider);
  };

  const signInAsAdmin = async () => {
    const adminEmail = 'admin@cuboid.local';
    const adminPassword = providerPassword('email', adminEmail);
    await signIn(adminEmail, adminPassword, 'email');
  };

  const sendMagicLink = async (email: string) => {
    setSessionError(null);
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setSessionError('Invalid email address.');
      throw new Error('Invalid email address.');
    }
    const { token } = await authService.sendMagicLink(normalized);
    const pending = readPendingMagicLinks();
    pending[normalized] = token;
    writePendingMagicLinks(pending);
  };

  const completeMagicLink = async (email: string, token?: string) => {
    setSessionError(null);
    const normalized = email.trim().toLowerCase();
    const pending = readPendingMagicLinks();
    const resolvedToken = token || pending[normalized];
    if (!resolvedToken) {
      const error = 'Missing magic-link token.';
      setSessionError(error);
      throw new Error(error);
    }

    const result = await authService.consumeMagicLink(normalized, resolvedToken);
    if ('error' in result) {
      setSessionError(result.error);
      throw new Error(result.error);
    }

    delete pending[normalized];
    writePendingMagicLinks(pending);
    await signIn(normalized, providerPassword('email', normalized), 'email');
  };

  const signOut = async () => {
    await authService.signOut();
    if (user) {
      clearWrappedMasterKey(user.id);
    }
    authService.clearSessionKey('auth-signout');
    setUser(null);
    setMasterKey(null);
    setRequiresUnlock(false);
    setWorkspaces([]);
    setSelectedWorkspaceIdState(null);
    setSessionError(null);
  };

  const setSelectedWorkspaceId = async (id: string) => {
    await LocalWorkspace.setSelectedWorkspace(id);
    setSelectedWorkspaceIdState(id);
  };

  const clearSessionError = () => {
    setSessionError(null);
  };

  const value = {
    user,
    masterKey,
    requiresUnlock,
    signIn,
    signInAsAdmin,
    signInWithProvider,
    unlockSession,
    sendMagicLink,
    completeMagicLink,
    signOut,
    workspaces,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    refreshWorkspaces,
    sessionError,
    clearSessionError,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
