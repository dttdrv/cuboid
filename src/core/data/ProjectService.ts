export interface MockProject {
  id: string;
  name: string;
  createdAt: Date;
}

export interface MockDocument {
  id: string;
  projectId: string;
  title: string;
  content: string;
}

export class ProjectService {
  private static instance: ProjectService;
  private projects: MockProject[] = [
    { id: '1', name: 'Project Alpha', createdAt: new Date() },
    { id: '2', name: 'Project Beta', createdAt: new Date() }
  ];
  private documents: MockDocument[] = [
    { id: 'doc1', projectId: '1', title: 'Alpha Specs', content: 'Specs content...' }
  ];

  private constructor() {}

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  /**
   * Lists all available projects.
   * Updated to async to match interface expectations and fix Dashboard crash.
   */
  async listProjects(): Promise<MockProject[]> {
    // Simulate async behavior (e.g., fetching from local storage or network)
    return Promise.resolve(this.projects);
  }

  /**
   * Creates a new project.
   * Updated to async with simulated network delay.
   */
  async createProject(name: string): Promise<MockProject> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const newProject: MockProject = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      createdAt: new Date()
    };

    this.projects.push(newProject);
    return newProject;
  }

  /**
   * Retrieves a specific document by ID.
   * Updated to async and handles "Document Not Found".
   */
  async getDocument(id: string): Promise<MockDocument> {
    const doc = this.documents.find(d => d.id === id);
    
    if (!doc) {
      throw new Error(`Document with ID "${id}" not found.`);
    }

    return doc;
  }
}