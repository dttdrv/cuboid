import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LocalAuth, LocalWorkspace } from '../storage/local';
import { deriveMasterKey, toBase64, fromBase64 } from '../crypto';
import { User, Workspace } from '../data/types';

interface AuthContextType {
  user: User | null;
  masterKey: CryptoKey | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'openai' | 'github' | 'google') => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLink: (email: string) => Promise<void>;
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
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

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for local session
      const { session } = await LocalAuth.getSession();

      if (session?.user) {
        setUser(session.user);
        await hydrateWorkspaceState(session.user.id);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const signIn = async (
    email: string,
    password: string,
    provider: 'email' | 'openai' | 'github' | 'google' = 'email'
  ) => {
    setLoading(true);
    setSessionError(null);
    try {
      // 1. Authenticate with Local Adapter
      const result = await LocalAuth.signIn(email, password, provider);
      if ('error' in result) throw result.error;
      const { user: authUser } = result;

      // 2. Fetch encryption_salt from profiles
      let saltBase64 = await LocalAuth.getEncryptionSalt(authUser.id);

      // 3. Handle New User / Missing Profile Handling
      if (!saltBase64) {
        // Generate new random 16-byte salt
        const saltBytes = crypto.getRandomValues(new Uint8Array(16));

        // Convert to Base64
        saltBase64 = toBase64(saltBytes);

        // Store salt
        await LocalAuth.setEncryptionSalt(authUser.id, saltBase64);
      }

      // 4. Key Derivation
      // Convert Base64 salt back to Uint8Array
      const saltBytes = fromBase64(saltBase64);

      // Derive the master key
      const key = await deriveMasterKey(password, saltBytes);

      // 5. Finalize State
      setUser(authUser);
      setMasterKey(key);
      await hydrateWorkspaceState(authUser.id);

    } catch (error) {
      console.error('Error during sign in:', error);
      setSessionError('Sign-in failed. Try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: 'openai' | 'github' | 'google') => {
    const providerEmail = `user+${provider}@prism.local`;
    await signIn(providerEmail, 'password', provider);
  };

  const sendMagicLink = async (email: string) => {
    setSessionError(null);
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setSessionError('Invalid email address.');
      throw new Error('Invalid email address.');
    }
    await LocalAuth.sendMagicLink(normalized);
  };

  const completeMagicLink = async (email: string) => {
    setSessionError(null);
    const result = await LocalAuth.consumeMagicLink(email.trim().toLowerCase());
    if ('error' in result) {
      setSessionError(result.error);
      throw new Error(result.error);
    }
    await signIn(email.trim().toLowerCase(), 'password', 'email');
  };

  const signOut = async () => {
    await LocalAuth.signOut();
    setUser(null);
    setMasterKey(null);
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
    signIn,
    signInWithProvider,
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
