/* eslint-disable no-restricted-globals */

import { CompileService } from '../core/compile/CompileService';
import { CompileEngineAdapter } from '../core/compile/types';

export interface CompileRequest {
  type: 'compile';
  id: string;
  texContent: string;
}

export interface CompileResponse {
  type: 'compile-result';
  id: string;
  success: boolean;
  pdf?: ArrayBuffer;
  log: string;
  errors: Array<{ line: number; message: string }>;
}

interface WorkerPdfTeXEngine {
  isReady?: () => boolean;
  loadEngine(): Promise<void>;
  writeMemFSFile(path: string, content: string | Uint8Array): void;
  setEngineMainFile(filename: string): void;
  compileLaTeX(): Promise<{ status?: number; pdf?: Uint8Array; log: string }>;
}

declare global {
  // eslint-disable-next-line no-var
  var PdfTeXEngine: { new (): WorkerPdfTeXEngine } | undefined;
}

let workerEngine: WorkerPdfTeXEngine | null = null;
let engineLoaded = false;

const ensureEngineScript = () => {
  if (typeof PdfTeXEngine !== 'undefined') return;
  importScripts('/swiftlatex/PdfTeXEngine.js');
  if (typeof PdfTeXEngine === 'undefined') {
    throw new Error('Local SwiftLaTeX engine script did not expose PdfTeXEngine.');
  }
};

const loadFormatFile = async (): Promise<Uint8Array | null> => {
  try {
    const formatResponse = await fetch('/swiftlatexpdftex.fmt');
    if (!formatResponse.ok) return null;
    const blob = await formatResponse.blob();
    return new Uint8Array(await blob.arrayBuffer());
  } catch {
    return null;
  }
};

class WorkerEngineAdapter implements CompileEngineAdapter {
  isReady(): boolean {
    if (!workerEngine) return false;
    if (workerEngine.isReady) return workerEngine.isReady();
    return engineLoaded;
  }

  async loadEngine(): Promise<void> {
    if (workerEngine && this.isReady()) return;
    ensureEngineScript();
    if (!workerEngine) {
      workerEngine = new PdfTeXEngine!();
    }
    await workerEngine.loadEngine();
    engineLoaded = true;
  }

  writeMemFSFile(path: string, content: string | Uint8Array): void {
    if (!workerEngine) throw new Error('Engine not initialized.');
    workerEngine.writeMemFSFile(path, content);
  }

  setEngineMainFile(filename: string): void {
    if (!workerEngine) throw new Error('Engine not initialized.');
    workerEngine.setEngineMainFile(filename);
  }

  compileLaTeX(): Promise<{ status?: number; pdf?: Uint8Array; log: string }> {
    if (!workerEngine) throw new Error('Engine not initialized.');
    return workerEngine.compileLaTeX();
  }
}

const compileService = new CompileService(new WorkerEngineAdapter(), {
  preloadFormat: loadFormatFile,
});

self.onmessage = async (event: MessageEvent<CompileRequest>) => {
  const { type, id, texContent } = event.data;
  if (type !== 'compile') return;

  try {
    const result = await compileService.compile(texContent);
    const pdf = result.pdfBytes
      ? result.pdfBytes.buffer.slice(
          result.pdfBytes.byteOffset,
          result.pdfBytes.byteOffset + result.pdfBytes.byteLength,
        )
      : undefined;
    const response: CompileResponse = {
      type: 'compile-result',
      id,
      success: result.success,
      pdf,
      log: result.log,
      errors: result.errors,
    };

    self.postMessage(response, response.pdf ? [response.pdf] : []);
  } catch (error) {
    const errorResponse: CompileResponse = {
      type: 'compile-result',
      id,
      success: false,
      log: error instanceof Error ? error.message : String(error),
      errors: [],
    };
    self.postMessage(errorResponse);
  }
};

export {};

