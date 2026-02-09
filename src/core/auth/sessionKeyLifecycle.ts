import {
  SessionKeyLifecycleEvent,
  SessionKeyLifecycleListener,
} from './AuthService';

const SESSION_KEY_STORAGE = 'cuboid_session_key_v1';
const listeners = new Set<SessionKeyLifecycleListener>();

const nowIso = () => new Date().toISOString();

const randomSessionKey = () => {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const bin = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(bin);
};

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  return window.sessionStorage;
};

const keyId = (base64: string) => base64.slice(0, 8);

const emit = (type: SessionKeyLifecycleEvent['type'], base64: string, reason?: string) => {
  const event: SessionKeyLifecycleEvent = {
    type,
    keyId: keyId(base64),
    timestamp: nowIso(),
    reason,
  };
  listeners.forEach((listener) => listener(event));
};

export const readSessionKey = (): string | null => {
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(SESSION_KEY_STORAGE);
};

export const ensureSessionKey = (reason = 'ensure'): string => {
  const existing = readSessionKey();
  if (existing) {
    emit('restored', existing, reason);
    return existing;
  }

  const created = randomSessionKey();
  const storage = getStorage();
  storage?.setItem(SESSION_KEY_STORAGE, created);
  emit('created', created, reason);
  return created;
};

export const rotateSessionKey = (reason = 'rotate'): string => {
  const next = randomSessionKey();
  const storage = getStorage();
  storage?.setItem(SESSION_KEY_STORAGE, next);
  emit('rotated', next, reason);
  return next;
};

export const clearSessionKey = (reason = 'clear'): void => {
  const existing = readSessionKey();
  const storage = getStorage();
  storage?.removeItem(SESSION_KEY_STORAGE);
  if (existing) {
    emit('cleared', existing, reason);
  }
};

export const onSessionKeyLifecycle = (listener: SessionKeyLifecycleListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

