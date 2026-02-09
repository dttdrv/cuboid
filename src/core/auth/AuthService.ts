import { Session, User } from '../data/types';

export type AuthProviderId = 'email' | 'openai' | 'github' | 'google';

export type SessionKeyEventType = 'created' | 'restored' | 'rotated' | 'cleared';

export interface SessionKeyLifecycleEvent {
  type: SessionKeyEventType;
  keyId: string;
  timestamp: string;
  reason?: string;
}

export type SessionKeyLifecycleListener = (event: SessionKeyLifecycleEvent) => void;

export interface AuthService {
  signIn(
    email: string,
    password: string,
    provider?: AuthProviderId
  ): Promise<{ user: User; session: Session } | { error: unknown }>;
  signOut(): Promise<void>;
  getSession(): Promise<{ session: Session | null }>;
  getEncryptionSalt(userId: string): Promise<string | null>;
  setEncryptionSalt(userId: string, salt: string): Promise<void>;
  sendMagicLink(email: string): Promise<{ token: string }>;
  consumeMagicLink(email: string, token: string): Promise<{ ok: true } | { error: string }>;
  ensureSessionKey(reason?: string): string;
  readSessionKey(): string | null;
  rotateSessionKey(reason?: string): string;
  clearSessionKey(reason?: string): void;
  onSessionKeyLifecycle(listener: SessionKeyLifecycleListener): () => void;
}

