import { Project, Document, User, Session, Workspace, WorkspaceRole } from '../data/types';

const KEYS = {
  USERS: 'cuboid_users',
  PROFILES: 'cuboid_profiles',
  PROJECTS: 'cuboid_projects',
  DOCUMENTS: 'cuboid_documents',
  SESSION: 'cuboid_session',
  WORKSPACES: 'cuboid_workspaces',
  SELECTED_WORKSPACE: 'cuboid_selected_workspace',
  MAGIC_LINKS: 'cuboid_magic_links',
  INVITES: 'cuboid_invites'
};

const delay = () => new Promise(r => setTimeout(r, 100));
const nowIso = () => new Date().toISOString();

const readJson = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

interface MagicLinkRecord {
  email: string;
  token: string;
  expires_at: number;
}

interface InviteRecord {
  token: string;
  workspace_id: string;
  workspace_name: string;
  role: WorkspaceRole;
  inviter: string;
  accepted_by?: string;
  declined_by?: string;
}

const ensureWorkspaceSeed = (userId: string, email: string) => {
  const records = readJson<Record<string, Workspace[]>>(KEYS.WORKSPACES, {});
  if (!records[userId] || records[userId].length === 0) {
    const created = nowIso();
    records[userId] = [
      {
        id: crypto.randomUUID(),
        name: `${email.split('@')[0]}'s Workspace`,
        avatar: email.slice(0, 1).toUpperCase(),
        role: 'Owner',
        created_at: created,
        updated_at: created
      }
    ];
    writeJson(KEYS.WORKSPACES, records);
  }
};

const ensureInviteSeed = () => {
  const invites = readJson<InviteRecord[]>(KEYS.INVITES, []);
  if (!invites.some((invite) => invite.token === 'demo-invite')) {
    invites.push({
      token: 'demo-invite',
      workspace_id: 'demo-workspace',
      workspace_name: 'Research Team',
      role: 'Member',
      inviter: 'alex@workspace.local'
    });
    writeJson(KEYS.INVITES, invites);
  }
};

export const LocalAuth = {
  signIn: async (
    email: string,
    password: string,
    provider: 'email' | 'openai' | 'github' | 'google' = 'email'
  ): Promise<{ user: User; session: Session } | { error: any }> => {
    await delay();
    const id = btoa(email).substring(0, 12); // Deterministic ID
    const created = nowIso();
    const user: User = {
      id,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      email_confirmed_at: created,
      phone: '',
      confirmed_at: created,
      last_sign_in_at: created,
      app_metadata: { provider, providers: [provider] },
      user_metadata: {},
      created_at: created,
      updated_at: created,
      factors: []
    };
    const session: Session = {
      access_token: 'local-token',
      refresh_token: 'local-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user
    };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
    ensureWorkspaceSeed(user.id, email);
    ensureInviteSeed();
    return { user, session };
  },

  signOut: async (): Promise<void> => {
    await delay();
    localStorage.removeItem(KEYS.SESSION);
  },

  getSession: async (): Promise<{ session: Session | null }> => {
    const json = localStorage.getItem(KEYS.SESSION);
    return { session: json ? JSON.parse(json) : null };
  },

  getEncryptionSalt: async (userId: string): Promise<string | null> => {
    const profiles = JSON.parse(localStorage.getItem(KEYS.PROFILES) || '{}');
    return profiles[userId] || null;
  },

  setEncryptionSalt: async (userId: string, salt: string): Promise<void> => {
    const profiles = readJson<Record<string, string>>(KEYS.PROFILES, {});
    profiles[userId] = salt;
    writeJson(KEYS.PROFILES, profiles);
  },

  sendMagicLink: async (email: string): Promise<{ token: string }> => {
    await delay();
    const token = crypto.randomUUID();
    const links = readJson<MagicLinkRecord[]>(KEYS.MAGIC_LINKS, []);
    links.push({
      email: email.toLowerCase(),
      token,
      expires_at: Date.now() + 15 * 60 * 1000
    });
    writeJson(KEYS.MAGIC_LINKS, links);
    return { token };
  },

  consumeMagicLink: async (
    email: string,
    token?: string
  ): Promise<{ ok: true } | { error: string }> => {
    await delay();
    const links = readJson<MagicLinkRecord[]>(KEYS.MAGIC_LINKS, []);
    const match = links
      .filter((link) => link.email === email.toLowerCase())
      .find((link) => (token ? link.token === token : true));

    if (!match) return { error: 'Magic link not found.' };
    if (Date.now() > match.expires_at) return { error: 'Magic link expired.' };

    const next = links.filter((link) => link.token !== match.token);
    writeJson(KEYS.MAGIC_LINKS, next);
    return { ok: true };
  }
};

export const LocalData = {
  listProjects: async (userId: string): Promise<Project[]> => {
    await delay();
    const projects = readJson<Project[]>(KEYS.PROJECTS, []);
    return projects.filter((p: Project) => p.owner_id === userId);
  },

  createProject: async (userId: string, name: string, workspaceId?: string): Promise<Project> => {
    await delay();
    const projects = readJson<Project[]>(KEYS.PROJECTS, []);
    const newProject: Project = {
      id: crypto.randomUUID(),
      owner_id: userId,
      workspace_id: workspaceId,
      name,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    projects.unshift(newProject);
    writeJson(KEYS.PROJECTS, projects);
    return newProject;
  },

  listProjectsByWorkspace: async (userId: string, workspaceId: string): Promise<Project[]> => {
    await delay();
    const projects = readJson<Project[]>(KEYS.PROJECTS, []);
    return projects.filter((project) => project.owner_id === userId && (!project.workspace_id || project.workspace_id === workspaceId));
  },

  getProjectById: async (projectId: string): Promise<Project | null> => {
    await delay();
    const projects = readJson<Project[]>(KEYS.PROJECTS, []);
    return projects.find((project) => project.id === projectId) || null;
  },

  getDocumentByProject: async (projectId: string): Promise<Document | null> => {
    await delay();
    const docs = readJson<Document[]>(KEYS.DOCUMENTS, []);
    return docs.find((d: Document) => d.project_id === projectId) || null;
  },

  saveDocument: async (doc: Document): Promise<void> => {
    await delay();
    const docs = readJson<Document[]>(KEYS.DOCUMENTS, []);
    const index = docs.findIndex((d: Document) => d.id === doc.id);
    if (index >= 0) {
      docs[index] = { ...docs[index], ...doc, updated_at: nowIso() };
    } else {
      docs.push(doc);
    }
    writeJson(KEYS.DOCUMENTS, docs);
  },

  createDocument: async (doc: Document): Promise<void> => {
    await delay();
    const docs = readJson<Document[]>(KEYS.DOCUMENTS, []);
    docs.push(doc);
    writeJson(KEYS.DOCUMENTS, docs);
  }
};

export const LocalWorkspace = {
  listWorkspaces: async (userId: string): Promise<Workspace[]> => {
    await delay();
    const byUser = readJson<Record<string, Workspace[]>>(KEYS.WORKSPACES, {});
    return byUser[userId] || [];
  },

  getWorkspaceById: async (userId: string, workspaceId: string): Promise<Workspace | null> => {
    await delay();
    const byUser = readJson<Record<string, Workspace[]>>(KEYS.WORKSPACES, {});
    const list = byUser[userId] || [];
    return list.find((workspace) => workspace.id === workspaceId) || null;
  },

  createWorkspace: async (
    userId: string,
    name: string,
    role: WorkspaceRole = 'Owner'
  ): Promise<Workspace> => {
    await delay();
    const byUser = readJson<Record<string, Workspace[]>>(KEYS.WORKSPACES, {});
    const created = nowIso();
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      name,
      avatar: name.slice(0, 1).toUpperCase() || 'W',
      role,
      created_at: created,
      updated_at: created
    };
    const current = byUser[userId] || [];
    byUser[userId] = [workspace, ...current];
    writeJson(KEYS.WORKSPACES, byUser);
    return workspace;
  },

  setSelectedWorkspace: async (workspaceId: string): Promise<void> => {
    await delay();
    localStorage.setItem(KEYS.SELECTED_WORKSPACE, workspaceId);
  },

  getSelectedWorkspace: async (): Promise<string | null> => {
    await delay();
    return localStorage.getItem(KEYS.SELECTED_WORKSPACE);
  }
};

export const LocalInvite = {
  getInvite: async (token: string): Promise<InviteRecord | null> => {
    await delay();
    ensureInviteSeed();
    const invites = readJson<InviteRecord[]>(KEYS.INVITES, []);
    return invites.find((invite) => invite.token === token) || null;
  },

  acceptInvite: async (token: string, userId: string): Promise<{ ok: true } | { error: string }> => {
    await delay();
    const invites = readJson<InviteRecord[]>(KEYS.INVITES, []);
    const invite = invites.find((item) => item.token === token);
    if (!invite) return { error: 'Invite not found.' };

    invite.accepted_by = userId;
    writeJson(KEYS.INVITES, invites);

    const byUser = readJson<Record<string, Workspace[]>>(KEYS.WORKSPACES, {});
    const current = byUser[userId] || [];
    if (!current.some((workspace) => workspace.id === invite.workspace_id)) {
      const created = nowIso();
      current.unshift({
        id: invite.workspace_id,
        name: invite.workspace_name,
        avatar: invite.workspace_name.slice(0, 1).toUpperCase(),
        role: invite.role,
        created_at: created,
        updated_at: created
      });
      byUser[userId] = current;
      writeJson(KEYS.WORKSPACES, byUser);
    }
    return { ok: true };
  },

  declineInvite: async (token: string, userId: string): Promise<{ ok: true } | { error: string }> => {
    await delay();
    const invites = readJson<InviteRecord[]>(KEYS.INVITES, []);
    const invite = invites.find((item) => item.token === token);
    if (!invite) return { error: 'Invite not found.' };
    invite.declined_by = userId;
    writeJson(KEYS.INVITES, invites);
    return { ok: true };
  }
};
