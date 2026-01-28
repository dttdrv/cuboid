import { PdfTeXEngine } from './PdfTeXEngine';

// @ts-ignore
import { CompilationResult } from './tex-compiler'; // Self-reference or ensure implementation matches


export interface CompilationResult {
  success: boolean;
  pdf?: Blob;
  log: string;
}

export class TeXCompiler {
  private engine: PdfTeXEngine;
  private initializing: boolean = false;

  constructor() {
    this.engine = new PdfTeXEngine();
  }

  async compile(texContent: string): Promise<CompilationResult> {
    try {
      if (!this.engine.isReady()) {
        if (!this.initializing) {
          this.initializing = true;
          await this.engine.loadEngine();

          // Preload format file
          try {
            const fmtRes = await fetch('/swiftlatexpdftex.fmt');
            if (fmtRes.ok) {
              const fmtBlob = await fmtRes.blob();
              const fmtArray = new Uint8Array(await fmtBlob.arrayBuffer());
              this.engine.writeMemFSFile('swiftlatexpdftex.fmt', fmtArray);
              console.log('Format file preloaded');
            } else {
              console.error('Failed to fetch format file');
            }
          } catch (e) {
            console.error('Error preloading format file:', e);
          }

          this.initializing = false;
        } else {
          // Wait until ready if already initializing?
          // Simple approach: re-await loadEngine or just wait loop
          while (this.initializing) {
            await new Promise(r => setTimeout(r, 100));
          }
          if (!this.engine.isReady()) await this.engine.loadEngine();
        }
      }

      this.engine.writeMemFSFile('main.tex', texContent);
      this.engine.setEngineMainFile('main.tex');

      const result = await this.engine.compileLaTeX();

      if (result.status === 0 && result.pdf) {
        const blob = new Blob([result.pdf], { type: 'application/pdf' });
        return {
          success: true,
          pdf: blob,
          log: result.log
        };
      } else {
        return {
          success: false,
          log: result.log || 'Compilation failed with unknown error'
        };
      }
    } catch (e: any) {
      console.error("Compilation error:", e);
      return {
        success: false,
        log: e.message || String(e)
      };
    }
  }
}