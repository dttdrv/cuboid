/* eslint-disable no-restricted-globals */

// Message Types
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

// Interface for SwiftLaTeX Engine (loaded dynamically via importScripts)
interface PdfTeXEngine {
  loadEngine(): Promise<void>;
  writeMemFSFile(path: string, content: string): void;
  setEngineMainFile(filename: string): void;
  compileLaTeX(): Promise<{ pdf: Uint8Array; log: string }>;
}

// Extend the global scope to include the dynamically loaded engine constructor
declare global {
  // eslint-disable-next-line no-var
  var PdfTeXEngine: { new (): PdfTeXEngine } | undefined;
}

let engine: PdfTeXEngine | null = null;
let engineLoaded = false;
let engineLoading = false;

async function loadEngine(): Promise<void> {
  if (engineLoaded || engineLoading) return;
  
  engineLoading = true;
  
  try {
    // Load SwiftLaTeX from CDN
    importScripts('https://cdn.jsdelivr.net/npm/swiftlatex@0.0.2/PdfTeXEngine.js');
    
    if (typeof PdfTeXEngine === 'undefined') {
      throw new Error('SwiftLaTeX engine script loaded but PdfTeXEngine is not defined.');
    }

    engine = new PdfTeXEngine();
    await engine.loadEngine();
    
    engineLoaded = true;
  } catch (error) {
    engineLoading = false;
    throw error;
  }
}

function parseTeXErrors(log: string): Array<{ line: number; message: string }> {
  const errors: Array<{ line: number; message: string }> = [];
  // Regex matches "! Error message" at start of line in TeX logs
  const regex = /^! (.+)$/gm;
  let match;
  while ((match = regex.exec(log)) !== null) {
    errors.push({ line: 0, message: match[1] });
  }
  return errors;
}

self.onmessage = async (event: MessageEvent<CompileRequest>) => {
  const { type, id, texContent } = event.data;

  if (type === 'compile') {
    try {
      await loadEngine();

      if (!engine) {
        throw new Error('Engine initialization failed.');
      }

      // Write main.tex
      engine.writeMemFSFile('main.tex', texContent);
      engine.setEngineMainFile('main.tex');

      // Compile
      const result = await engine.compileLaTeX();

      // Parse errors from log
      const errors = parseTeXErrors(result.log);

      const response: CompileResponse = {
        type: 'compile-result',
        id,
        success: !!(result.pdf && result.pdf.length > 0),
        pdf: result.pdf ? result.pdf.buffer : undefined,
        log: result.log,
        errors
      };

      // Send response, transferring the ArrayBuffer if it exists to avoid copying
      self.postMessage(response, response.pdf ? [response.pdf] : []);
      
    } catch (e) {
      const errorResponse: CompileResponse = {
        type: 'compile-result',
        id,
        success: false,
        log: String(e),
        errors: []
      };
      self.postMessage(errorResponse);
    }
  }
};

export {};