import { DiagnosticItem } from '../data/types';

const DEFAULT_POLL_INTERVAL_MS = 350;
const DEFAULT_COMPILE_TIMEOUT_MS = 120000;

const terminalStatuses = new Set(['success', 'succeeded', 'failed', 'error', 'cancelled']);

export interface BackendCompileRequest {
  projectId: string;
  mainFile: string;
  content: string;
}

export interface BackendCompileResult {
  status: string;
  log: string;
  diagnostics: DiagnosticItem[];
  pdfBlob: Blob | null;
}

export interface BackendSettings {
  aiEnabled: boolean;
  aiProvider: string;
  aiModel: string;
}

export interface BackendProjectManifest {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendFileEntry {
  path: string;
  size: number;
  modifiedAt: string;
}

export interface BackendAiEditSuggestion {
  title: string;
  summary: string;
  startLine: number;
  endLine: number;
}

export interface BackendAiEditResponse {
  suggestions: BackendAiEditSuggestion[];
}

export interface BackendChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: unknown;
}

export interface BackendAiChatResponse {
  assistantText: string;
  raw: any;
}

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');

export const getBackendBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_CUBOID_BACKEND_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) {
    return normalizeBaseUrl(envUrl);
  }
  return '';
};

const toDiagnostic = (item: any, fallbackFileId: string): DiagnosticItem => ({
  id: String(item?.id || crypto.randomUUID()),
  severity: item?.severity === 'warning' || item?.severity === 'note' ? item.severity : 'error',
  fileId: String(item?.fileId || fallbackFileId),
  line: Number(item?.line || 1),
  column: Number(item?.column || 1),
  message: String(item?.message || 'Unknown compile issue'),
});

const decodeBase64Pdf = (value: string | null | undefined): Blob | null => {
  if (!value) return null;
  try {
    const clean = value.includes(',') ? value.split(',').pop() || '' : value;
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'application/pdf' });
  } catch {
    return null;
  }
};

const requestJson = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `Backend request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
};

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
};

export const fetchBackendSettings = async (): Promise<BackendSettings> => {
  const payload = await requestJson<any>('/v1/settings');
  return {
    aiEnabled: !!(payload?.aiEnabled ?? payload?.ai_enabled ?? true),
    aiProvider: String(payload?.aiProvider || payload?.ai_provider || 'nvidia'),
    aiModel: String(payload?.aiModel || payload?.ai_model || 'moonshotai/kimi-k2.5'),
  };
};

export const backendListProjects = async (): Promise<BackendProjectManifest[]> => {
  const payload = await requestJson<any>('/v1/projects');
  const projectsRaw = Array.isArray(payload?.projects) ? payload.projects : [];
  return projectsRaw.map((item: any) => ({
    id: String(item?.id || ''),
    name: String(item?.name || 'Untitled Project'),
    createdAt: String(item?.createdAt || new Date().toISOString()),
    updatedAt: String(item?.updatedAt || item?.createdAt || new Date().toISOString()),
  })).filter((p: BackendProjectManifest) => p.id.length > 0);
};

export const backendCreateProject = async (name: string): Promise<BackendProjectManifest> => {
  const payload = await requestJson<any>('/v1/projects', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return {
    id: String(payload?.id || ''),
    name: String(payload?.name || name || 'Untitled Project'),
    createdAt: String(payload?.createdAt || new Date().toISOString()),
    updatedAt: String(payload?.updatedAt || payload?.createdAt || new Date().toISOString()),
  };
};

export const backendListFiles = async (projectId: string): Promise<{ project: BackendProjectManifest; files: BackendFileEntry[] }> => {
  const payload = await requestJson<any>(`/v1/projects/${encodeURIComponent(projectId)}/files`);
  const projectRaw = payload?.project || {};
  const filesRaw = Array.isArray(payload?.files) ? payload.files : [];
  return {
    project: {
      id: String(projectRaw?.id || projectId),
      name: String(projectRaw?.name || 'Untitled Project'),
      createdAt: String(projectRaw?.createdAt || new Date().toISOString()),
      updatedAt: String(projectRaw?.updatedAt || projectRaw?.createdAt || new Date().toISOString()),
    },
    files: filesRaw.map((item: any) => ({
      path: String(item?.path || ''),
      size: Number(item?.size || 0),
      modifiedAt: String(item?.modifiedAt || new Date().toISOString()),
    })).filter((f: BackendFileEntry) => f.path.length > 0),
  };
};

export const backendReadFile = async (projectId: string, path: string): Promise<string> => {
  const payload = await requestJson<any>(`/v1/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(path)}`);
  return String(payload?.content || '');
};

export const backendWriteFile = async (projectId: string, path: string, content: string): Promise<void> => {
  await requestJson<any>(`/v1/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(path)}`, {
    method: 'PUT',
    body: JSON.stringify({ content, encoding: 'utf8' }),
  });
};

export const setBackendAiToggle = async (enabled: boolean): Promise<BackendSettings> => {
  const payload = await requestJson<any>('/v1/settings/ai-toggle', {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
  return {
    aiEnabled: !!(payload?.aiEnabled ?? payload?.ai_enabled ?? enabled),
    aiProvider: String(payload?.aiProvider || payload?.ai_provider || 'nvidia'),
    aiModel: String(payload?.aiModel || payload?.ai_model || 'moonshotai/kimi-k2.5'),
  };
};

export const requestBackendAiEdits = async (input: {
  projectId: string;
  mainFile: string;
  content: string;
  prompt: string;
  selection: { startLine: number; endLine: number };
}): Promise<BackendAiEditResponse> => {
  const payload = await requestJson<any>('/v1/ai/edits', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const suggestionsRaw = Array.isArray(payload?.suggestions) ? payload.suggestions : [];
  return {
    suggestions: suggestionsRaw.map((item: any) => ({
      title: String(item?.title || 'AI suggestion'),
      summary: String(item?.summary || ''),
      startLine: Number(item?.startLine || input.selection.startLine),
      endLine: Number(item?.endLine || input.selection.endLine),
    })),
  };
};

const unwrapAssistantText = (rawContent: any): string => {
  if (typeof rawContent === 'string') return rawContent;
  if (rawContent && typeof rawContent === 'object' && !Array.isArray(rawContent)) {
    if (typeof rawContent.text === 'string') return rawContent.text;
    if (typeof rawContent.content === 'string') return rawContent.content;
  }
  if (!Array.isArray(rawContent)) return '';
  const textParts = rawContent
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        if (typeof item.text === 'string') return item.text;
        if (typeof item.content === 'string') return item.content;
      }
      return '';
    })
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
  return textParts.join('\n').trim();
};

const unwrapAssistantReasoning = (rawReasoning: any): string => {
  if (typeof rawReasoning === 'string') return rawReasoning.trim();
  if (rawReasoning && typeof rawReasoning === 'object') {
    if (typeof rawReasoning.text === 'string') return rawReasoning.text.trim();
    if (typeof rawReasoning.content === 'string') return rawReasoning.content.trim();
  }
  if (!Array.isArray(rawReasoning)) return '';
  const parts = rawReasoning
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        if (typeof item.text === 'string') return item.text;
        if (typeof item.content === 'string') return item.content;
      }
      return '';
    })
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
  return parts.join('\n').trim();
};

export const requestBackendAiChat = async (input: {
  model?: string;
  messages: BackendChatMessage[];
  temperature?: number;
  maxTokens?: number;
  extraBody?: Record<string, unknown>;
}): Promise<BackendAiChatResponse> => {
  const payload = await requestJson<any>('/v1/ai/chat', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const raw = payload?.response ?? payload ?? {};
  const firstChoice = raw?.choices?.[0];
  const message = firstChoice?.message;
  const assistantText = unwrapAssistantText(message?.content);
  const assistantReasoning = unwrapAssistantReasoning(
    message?.reasoning ?? message?.reasoning_content ?? firstChoice?.reasoning ?? firstChoice?.reasoning_content,
  );
  return {
    assistantText: assistantText || assistantReasoning || 'No textual response returned.',
    raw,
  };
};

export const compileViaBackend = async (
  request: BackendCompileRequest,
): Promise<BackendCompileResult> => {
  const created = await requestJson<any>('/v1/compile/jobs', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  const jobId = String(
    created?.jobId || created?.job_id || created?.id || created?.compileJobId || '',
  );

  if (!jobId) {
    throw new Error('Backend compile response missing job id');
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt <= DEFAULT_COMPILE_TIMEOUT_MS) {
    const statusPayload = await requestJson<any>(`/v1/compile/jobs/${encodeURIComponent(jobId)}`);
    const rawStatus = String(statusPayload?.status || '').toLowerCase();
    const status = rawStatus === 'succeeded' ? 'success' : rawStatus;

    if (terminalStatuses.has(rawStatus) || terminalStatuses.has(status)) {
      const diagnosticsRaw = Array.isArray(statusPayload?.diagnostics)
        ? statusPayload.diagnostics
        : Array.isArray(statusPayload?.errors)
          ? statusPayload.errors
          : [];
      const diagnostics = diagnosticsRaw.map((item: any) => toDiagnostic(item, request.mainFile));
      const log = String(statusPayload?.log || statusPayload?.compileLog || '');
      const pdfBlob = decodeBase64Pdf(
        statusPayload?.pdfBase64 || statusPayload?.pdf_base64 || statusPayload?.artifact?.pdfBase64,
      );
      return {
        status,
        log,
        diagnostics,
        pdfBlob,
      };
    }

    await sleep(DEFAULT_POLL_INTERVAL_MS);
  }

  throw new Error('Compile request timed out while waiting for backend job completion');
};
