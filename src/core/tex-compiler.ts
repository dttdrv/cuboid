import { PdfTeXEngine } from './PdfTeXEngine';
import { CompileService } from './compile/CompileService';
import { CompileEngineAdapter } from './compile/types';

export interface CompilationResult {
  success: boolean;
  pdf?: Blob;
  log: string;
}

const loadFormatFile = async (): Promise<Uint8Array | null> => {
  try {
    const formatResponse = await fetch('/swiftlatexpdftex.fmt');
    if (!formatResponse.ok) return null;
    const formatBlob = await formatResponse.blob();
    return new Uint8Array(await formatBlob.arrayBuffer());
  } catch {
    return null;
  }
};

class PdfTeXEngineAdapter implements CompileEngineAdapter {
  constructor(private readonly engine: PdfTeXEngine = new PdfTeXEngine()) { }

  isReady(): boolean {
    return this.engine.isReady();
  }

  loadEngine(): Promise<void> {
    return this.engine.loadEngine();
  }

  writeMemFSFile(path: string, content: string | Uint8Array): void {
    this.engine.writeMemFSFile(path, content);
  }

  setEngineMainFile(filename: string): void {
    this.engine.setEngineMainFile(filename);
  }

  async compileLaTeX() {
    const result = await this.engine.compileLaTeX();
    return {
      status: result.status,
      pdf: result.pdf,
      log: result.log,
    };
  }
}

export class TeXCompiler {
  private readonly compileService = new CompileService(new PdfTeXEngineAdapter(), {
    preloadFormat: loadFormatFile,
  });

  async compile(texContent: string): Promise<CompilationResult> {
    const result = await this.compileService.compile(texContent);
    if (result.success && result.pdfBytes) {
      return {
        success: true,
        pdf: new Blob([result.pdfBytes as BlobPart], { type: 'application/pdf' }),
        log: result.log,
      };
    }

    return {
      success: false,
      log: result.log || 'Compilation failed with unknown error',
    };
  }
}

