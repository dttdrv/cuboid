import { DataStore } from './DataStore';
import { LocalData } from './local';

class BrowserLocalDataStore implements DataStore {
  listProjects(userId: string) {
    return LocalData.listProjects(userId);
  }

  listProjectsByWorkspace(userId: string, workspaceId: string) {
    return LocalData.listProjectsByWorkspace(userId, workspaceId);
  }

  createProject(userId: string, name: string, workspaceId?: string) {
    return LocalData.createProject(userId, name, workspaceId);
  }

  getProjectById(projectId: string) {
    return LocalData.getProjectById(projectId);
  }

  getDocumentByProject(projectId: string) {
    return LocalData.getDocumentByProject(projectId);
  }

  saveDocument(doc: Parameters<DataStore['saveDocument']>[0]) {
    return LocalData.saveDocument(doc);
  }

  createDocument(doc: Parameters<DataStore['createDocument']>[0]) {
    return LocalData.createDocument(doc);
  }
}

const localDataStore = new BrowserLocalDataStore();

export const getDataStore = (): DataStore => localDataStore;

