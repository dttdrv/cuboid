import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LocalAuth } from '../storage/local';
import { deriveMasterKey, toBase64, fromBase64 } from '../crypto';
import { User } from '../data/types';

interface AuthContextType {
  user: User | null;
  masterKey: CryptoKey | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for local session
      const { session } = await LocalAuth.getSession();

      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // 1. Authenticate with Local Adapter
      const result = await LocalAuth.signIn(email, password);
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

    } catch (error) {
      console.error('Error during sign in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await LocalAuth.signOut();
    setUser(null);
    setMasterKey(null);
  };

  const value = {
    user,
    masterKey,
    signIn,
    signOut,
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