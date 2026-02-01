import { User, Session } from '@supabase/supabase-js';
import { Project, Document } from '../data/types';

const KEYS = {
  USERS: 'cuboid_users',
  PROFILES: 'cuboid_profiles',
  PROJECTS: 'cuboid_projects',
  DOCUMENTS: 'cuboid_documents',
  SESSION: 'cuboid_session'
};

const delay = () => new Promise(r => setTimeout(r, 100));

export const LocalAuth = {
  signIn: async (email: string, password: string): Promise<{ user: User; session: Session } | { error: any }> => {
    await delay();
    const id = btoa(email).substring(0, 12); // Deterministic ID
    const user: User = {
      id,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
    const profiles = JSON.parse(localStorage.getItem(KEYS.PROFILES) || '{}');
    profiles[userId] = salt;
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
  }
};

export const LocalData = {
  listProjects: async (userId: string): Promise<Project[]> => {
    await delay();
    const projects = JSON.parse(localStorage.getItem(KEYS.PROJECTS) || '[]');
    return projects.filter((p: Project) => p.owner_id === userId);
  },

  createProject: async (userId: string, name: string): Promise<Project> => {
    await delay();
    const projects = JSON.parse(localStorage.getItem(KEYS.PROJECTS) || '[]');
    const newProject: Project = {
      id: crypto.randomUUID(),
      owner_id: userId,
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    projects.unshift(newProject);
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
    return newProject;
  },

  getDocumentByProject: async (projectId: string): Promise<Document | null> => {
    await delay();
    const docs = JSON.parse(localStorage.getItem(KEYS.DOCUMENTS) || '[]');
    return docs.find((d: Document) => d.project_id === projectId) || null;
  },

  saveDocument: async (doc: Document): Promise<void> => {
    await delay();
    const docs = JSON.parse(localStorage.getItem(KEYS.DOCUMENTS) || '[]');
    const index = docs.findIndex((d: Document) => d.id === doc.id);
    if (index >= 0) {
      docs[index] = { ...docs[index], ...doc, updated_at: new Date().toISOString() };
    } else {
      docs.push(doc);
    }
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
  },
  
  createDocument: async (doc: Document): Promise<void> => {
      await delay();
      const docs = JSON.parse(localStorage.getItem(KEYS.DOCUMENTS) || '[]');
      docs.push(doc);
      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
  }
};