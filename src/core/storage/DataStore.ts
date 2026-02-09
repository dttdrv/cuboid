import { Document, Project } from '../data/types';

export interface DataStore {
  listProjects(userId: string): Promise<Project[]>;
  listProjectsByWorkspace(userId: string, workspaceId: string): Promise<Project[]>;
  createProject(userId: string, name: string, workspaceId?: string): Promise<Project>;
  getProjectById(projectId: string): Promise<Project | null>;
  getDocumentByProject(projectId: string): Promise<Document | null>;
  saveDocument(doc: Document): Promise<void>;
  createDocument(doc: Document): Promise<void>;
}

