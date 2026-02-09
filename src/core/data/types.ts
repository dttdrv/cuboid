export interface Project {
  id: string;
  owner_id: string;
  workspace_id?: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

export type WorkspaceRole = 'Owner' | 'Admin' | 'Member';

export interface Workspace {
  id: string;
  name: string;
  avatar: string;
  role: WorkspaceRole;
  created_at: string;
  updated_at: string;
}

export type CompileState = 'idle' | 'compiling' | 'success' | 'error';

export interface DiagnosticItem {
  id: string;
  severity: 'error' | 'warning' | 'note';
  fileId: string;
  line: number;
  column: number;
  message: string;
}

export type AssistantPolicy = 'propose_only' | 'auto_safe' | 'auto_all';

export interface AssistantScope {
  includePdf: boolean;
  includeLogs: boolean;
  includeFileTree: boolean;
  summary: string;
}

export type ChangeSetStatus = 'proposed' | 'applied' | 'rejected' | 'partial';

export interface ChangeSet {
  id: string;
  title: string;
  status: ChangeSetStatus;
  filesChanged: string[];
  hunks?: Array<{
    id: string;
    file: string;
    startLine: number;
    endLine: number;
    beforeText: string;
    afterText: string;
    status: 'proposed' | 'accepted' | 'rejected';
  }>;
  presentation?: 'panel' | 'inline' | 'mixed';
  diffs: Array<{
    file: string;
    unifiedDiff: string;
  }>;
  createdAt: string;
}

export interface AssistantThreadMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  changeSetIds?: string[];
}

export interface CompileSummary {
  status: CompileState;
  errorCount: number;
  warningCount: number;
  lastCompiledAt?: string;
}

export interface CommentAnchor {
  fileId: string;
  lineStart: number;
  lineEnd: number;
}

export interface CommentThread {
  id: string;
  anchor: CommentAnchor;
  messages: Array<{
    id: string;
    body: string;
    createdAt: string;
  }>;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  kind:
    | 'tool_call'
    | 'tool_result'
    | 'reasoning_step'
    | 'changeset_created'
    | 'changeset_applied'
    | 'compile_start'
    | 'compile_end'
    | 'error';
  title: string;
  detail?: string;
  timestamp: string;
  relatedCommandId?: string;
  relatedChangeSetId?: string;
  fileId?: string;
  line?: number;
}

export interface ActivityFilter {
  showTools: boolean;
  showReasoning: boolean;
  showCompile: boolean;
  showChanges: boolean;
}

export interface RuntimeCapabilities {
  fileSystemAccessSupported: boolean;
  speechRecognitionSupported: boolean;
  mediaRecorderSupported: boolean;
}

export interface User {
  id: string;
  email?: string;
  app_metadata: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata: {
    [key: string]: any;
  };
  aud: string;
  created_at: string;
  updated_at?: string;
  role?: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  factors?: any[];
}

export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: User;
  expires_at?: number;
}

export interface Document {
  id: string;
  project_id: string;
  owner_id: string;
  title: string;
  content_encrypted: string; // Base64 blob
  iv: string; // Base64 blob
  salt: string; // Base64 blob
  created_at: string;
}
