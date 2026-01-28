import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

class CollaborationManager {
  private ydoc: Y.Doc;
  private provider: WebrtcProvider | null;

  constructor() {
    this.ydoc = new Y.Doc();
    this.provider = null;
  }

  public connect(roomName: string, password: string): void {
    if (this.provider) {
      this.provider.destroy();
    }

    // Use default signaling options or specify if needed.
    // 'signaling' option can be added if we host our own signaling server.
    // For now, default public signaling servers are used for dev.
    this.provider = new WebrtcProvider(roomName, this.ydoc, {
      password,
      signaling: ['wss://signaling.yjs.dev'] // Explicit default for clarity
    });
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