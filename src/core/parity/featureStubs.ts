export interface CollaborationScaleAdapter {
  listOnlinePeers(projectId: string): Promise<Array<{ id: string; label: string }>>;
  createShareSession(projectId: string): Promise<{ sessionId: string; shareUrl: string }>;
}

export interface CitationWorkflowAdapter {
  searchReferences(query: string): Promise<Array<{ id: string; title: string; source: string }>>;
  importCitation(referenceId: string): Promise<{ bibtex: string; key: string }>;
}

export interface DataTableAdapter {
  summarizeDataset(input: string): Promise<{ columns: string[]; rows: Array<Record<string, string>> }>;
  exportTable(format: 'csv' | 'tsv' | 'xlsx', payload: unknown): Promise<{ pathHint: string }>;
}

export interface ExternalConnectorAdapter {
  listConnectors(): Promise<Array<{ id: string; label: string; status: 'available' | 'stubbed' }>>;
  connect(connectorId: string): Promise<{ connected: boolean; message: string }>;
}

const unsupported = async () => {
  throw new Error('Local-first stub: backend connector is not enabled in this runtime.');
};

export const localCollaborationScaleStub: CollaborationScaleAdapter = {
  listOnlinePeers: async () => [],
  createShareSession: unsupported,
};

export const localCitationWorkflowStub: CitationWorkflowAdapter = {
  searchReferences: async () => [],
  importCitation: unsupported,
};

export const localDataTableStub: DataTableAdapter = {
  summarizeDataset: async () => ({ columns: [], rows: [] }),
  exportTable: unsupported,
};

export const localExternalConnectorStub: ExternalConnectorAdapter = {
  listConnectors: async () => [
    { id: 'zotero', label: 'Zotero', status: 'stubbed' },
    { id: 'crossref', label: 'Crossref', status: 'available' },
  ],
  connect: unsupported,
};
