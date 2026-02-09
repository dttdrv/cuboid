import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

const DEFAULT_SIGNALING = ['wss://signaling.yjs.dev'];
const ALLOWED_SIGNALING_HOSTS = ['signaling.yjs.dev'];

export interface CollaborationIdentity {
  workspaceId: string;
  projectId: string;
  userId: string;
}

export interface CollaborationConnectOptions {
  roomName?: string;
  password: string;
  identity: CollaborationIdentity;
  signaling?: string[];
}

const sanitizeToken = (value: string, field: string): string => {
  const trimmed = value.trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,64}$/.test(trimmed)) {
    throw new Error(`Invalid collaboration ${field}.`);
  }
  return trimmed;
};

const resolveRoomName = (options: CollaborationConnectOptions): string => {
  if (options.roomName) {
    return sanitizeToken(options.roomName, 'room id');
  }
  const workspace = sanitizeToken(options.identity.workspaceId, 'workspace id');
  const project = sanitizeToken(options.identity.projectId, 'project id');
  return `cuboid_${workspace}_${project}`;
};

const sanitizeSignaling = (urls?: string[]): string[] => {
  if (!urls || urls.length === 0) return DEFAULT_SIGNALING;
  const filtered = urls.filter((candidate) => {
    try {
      const url = new URL(candidate);
      if (url.protocol !== 'wss:') return false;
      return ALLOWED_SIGNALING_HOSTS.includes(url.hostname.toLowerCase());
    } catch {
      return false;
    }
  });
  return filtered.length > 0 ? filtered : DEFAULT_SIGNALING;
};

class CollaborationManager {
  private readonly ydoc: Y.Doc;
  private provider: WebrtcProvider | null;

  constructor() {
    this.ydoc = new Y.Doc();
    this.provider = null;
  }

  public connect(options: CollaborationConnectOptions): void;
  public connect(roomName: string, password: string): void;
  public connect(optionsOrRoomName: CollaborationConnectOptions | string, password?: string): void {
    if (this.provider) {
      this.provider.destroy();
    }

    const options: CollaborationConnectOptions =
      typeof optionsOrRoomName === 'string'
        ? {
            roomName: optionsOrRoomName,
            password: password || '',
            identity: {
              workspaceId: 'legacy',
              projectId: 'legacy',
              userId: 'legacy',
            },
          }
        : optionsOrRoomName;

    const roomName = resolveRoomName(options);
    const signaling = sanitizeSignaling(options.signaling);
    const identity = {
      workspaceId: sanitizeToken(options.identity.workspaceId, 'workspace id'),
      projectId: sanitizeToken(options.identity.projectId, 'project id'),
      userId: sanitizeToken(options.identity.userId, 'user id'),
    };

    this.provider = new WebrtcProvider(roomName, this.ydoc, {
      password: options.password,
      signaling,
    });
    this.provider.awareness.setLocalStateField('user', identity);
  }

  public disconnect(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
  }

  public getDoc(): Y.Doc {
    return this.ydoc;
  }

  public getProvider(): WebrtcProvider | null {
    return this.provider;
  }

  public getStatus(): string {
    return this.provider ? 'connected' : 'disconnected';
  }
}

export const collaborationManager = new CollaborationManager();

