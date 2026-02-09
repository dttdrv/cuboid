import { parseTeXErrors } from './diagnostics';
import { CompileEngineAdapter, CompileOutput, CompileServiceOptions } from './types';

const DEFAULT_MAIN_FILE = 'main.tex';
const DEFAULT_FORMAT_FILE = 'swiftlatexpdftex.fmt';

export class CompileService {
  private initializing = false;

  constructor(
    private readonly engine: CompileEngineAdapter,
    private readonly options: CompileServiceOptions = {},
  ) {}

  private async ensureReady() {
    if (this.engine.isReady()) return;
    if (this.initializing) {
      while (this.initializing) {
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      return;
    }

    this.initializing = true;
    try {
      await this.engine.loadEngine();
      if (this.options.preloadFormat) {
        const format = await this.options.preloadFormat();
        if (format) {
          this.engine.writeMemFSFile(this.options.formatFileName || DEFAULT_FORMAT_FILE, format);
        }
      }
    } finally {
      this.initializing = false;
    }
  }

  public async compile(texContent: string): Promise<CompileOutput> {
    await this.ensureReady();

    const mainFile = this.options.mainFile || DEFAULT_MAIN_FILE;
    this.engine.writeMemFSFile(mainFile, texContent);
    this.engine.setEngineMainFile(mainFile);

    try {
      const result = await this.engine.compileLaTeX();
      const success = typeof result.status === 'number' ? result.status === 0 : !!result.pdf?.length;
      const log = result.log || '';
      return {
        success,
        log,
        pdfBytes: success ? result.pdf : undefined,
        errors: parseTeXErrors(log),
      };
    } catch (error) {
      const log = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        log,
        errors: parseTeXErrors(log),
      };
    }
  }
}

