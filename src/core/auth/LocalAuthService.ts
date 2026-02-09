import { AuthService } from './AuthService';
import {
  clearSessionKey,
  ensureSessionKey,
  onSessionKeyLifecycle,
  readSessionKey,
  rotateSessionKey,
} from './sessionKeyLifecycle';
import { LocalAuth } from '../storage/local';

class LocalBrowserAuthService implements AuthService {
  signIn(email: string, password: string, provider: Parameters<typeof LocalAuth.signIn>[2] = 'email') {
    return LocalAuth.signIn(email, password, provider);
  }

  signOut() {
    return LocalAuth.signOut();
  }

  getSession() {
    return LocalAuth.getSession();
  }

  getEncryptionSalt(userId: string) {
    return LocalAuth.getEncryptionSalt(userId);
  }

  setEncryptionSalt(userId: string, salt: string) {
    return LocalAuth.setEncryptionSalt(userId, salt);
  }

  sendMagicLink(email: string) {
    return LocalAuth.sendMagicLink(email);
  }

  consumeMagicLink(email: string, token: string) {
    return LocalAuth.consumeMagicLink(email, token);
  }

  ensureSessionKey(reason?: string) {
    return ensureSessionKey(reason);
  }

  readSessionKey() {
    return readSessionKey();
  }

  rotateSessionKey(reason?: string) {
    return rotateSessionKey(reason);
  }

  clearSessionKey(reason?: string) {
    clearSessionKey(reason);
  }

  onSessionKeyLifecycle(listener: Parameters<typeof onSessionKeyLifecycle>[0]) {
    return onSessionKeyLifecycle(listener);
  }
}

const authService = new LocalBrowserAuthService();

export const getAuthService = (): AuthService => authService;

