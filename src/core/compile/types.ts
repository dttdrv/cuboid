export interface CompileDiagnostic {
  line: number;
  message: string;
}

export type CompileTrigger = 'auto' | 'manual' | 'retry';

export type CompileRunState = 'idle' | 'queued' | 'compiling' | 'success' | 'error';

export interface CompileRunMeta {
  trigger: CompileTrigger;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  cancelled: boolean;
}

export interface CompileOutput {
  success: boolean;
  log: string;
  pdfBytes?: Uint8Array;
  errors: CompileDiagnostic[];
}

export interface CompileEngineAdapter {
  isReady(): boolean;
  loadEngine(): Promise<void>;
  writeMemFSFile(path: string, content: string | Uint8Array): void;
  setEngineMainFile(filename: string): void;
  compileLaTeX(): Promise<{ status?: number; pdf?: Uint8Array; log: string }>;
}

export interface CompileServiceOptions {
  mainFile?: string;
  preloadFormat?: () => Promise<Uint8Array | null>;
  formatFileName?: string;
}
