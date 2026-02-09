import { RuntimeCapabilities } from '../data/types';

export interface ProjectHandle {
  id: string;
  name: string;
  kind: 'filesystem' | 'local';
  pathHint: string;
  workspaceId?: string;
}

const FILESYSTEM_HANDLES_KEY = 'cuboid_fs_handles';

type StoredHandleMap = Record<string, string>;

const readHandleMap = (): StoredHandleMap => {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    return JSON.parse(window.localStorage.getItem(FILESYSTEM_HANDLES_KEY) || '{}') as StoredHandleMap;
  } catch {
    return {};
  }
};

const writeHandleMap = (map: StoredHandleMap) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(FILESYSTEM_HANDLES_KEY, JSON.stringify(map));
};

export const runtimeCapabilities: RuntimeCapabilities = {
  fileSystemAccessSupported: typeof window !== 'undefined' && 'showDirectoryPicker' in window,
  speechRecognitionSupported:
    typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
  mediaRecorderSupported: typeof window !== 'undefined' && 'MediaRecorder' in window,
};

export const openDirectory = async (): Promise<ProjectHandle | null> => {
  if (!runtimeCapabilities.fileSystemAccessSupported) return null;
  const picker = (window as any).showDirectoryPicker;
  if (!picker) return null;

  const handle = await picker();
  const id = `fs_${handle.name}_${Date.now()}`;

  // We cannot persist FileSystemHandle directly in localStorage.
  // Persist a lightweight hint while fallback adapters retain file state in memory/local DB.
  const map = readHandleMap();
  map[id] = handle.name;
  writeHandleMap(map);

  return {
    id,
    name: handle.name,
    kind: 'filesystem',
    pathHint: `~/${handle.name}`,
  };
};

export const listStoredProjectHandles = (): ProjectHandle[] => {
  const map = readHandleMap();
  return Object.entries(map).map(([id, name]) => ({
    id,
    name,
    kind: 'filesystem',
    pathHint: `~/${name}`,
  }));
};

