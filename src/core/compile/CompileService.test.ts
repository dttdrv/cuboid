import { describe, expect, it } from 'vitest';
import { CompileService } from './CompileService';
import { CompileEngineAdapter } from './types';

class MockCompileEngine implements CompileEngineAdapter {
  ready = false;
  loaded = 0;
  mainFile: string | null = null;
  content = '';

  isReady(): boolean {
    return this.ready;
  }

  async loadEngine(): Promise<void> {
    this.loaded += 1;
    this.ready = true;
  }

  writeMemFSFile(path: string, content: string | Uint8Array): void {
    this.mainFile = path;
    this.content = typeof content === 'string' ? content : String(content.byteLength);
  }

  setEngineMainFile(filename: string): void {
    this.mainFile = filename;
  }

  async compileLaTeX() {
    if (this.content.includes('!fail')) {
      return { status: 1, log: '! Undefined control sequence' };
    }
    return {
      status: 0,
      pdf: new Uint8Array([1, 2, 3]),
      log: 'ok',
    };
  }
}

describe('CompileService', () => {
  it('loads engine once and returns successful compile output', async () => {
    const engine = new MockCompileEngine();
    const service = new CompileService(engine);
    const result = await service.compile('\\documentclass{article}');

    expect(engine.loaded).toBe(1);
    expect(engine.mainFile).toBe('main.tex');
    expect(result.success).toBe(true);
    expect(result.pdfBytes?.length).toBe(3);
    expect(result.errors).toEqual([]);
  });

  it('parses TeX errors when compile fails', async () => {
    const engine = new MockCompileEngine();
    const service = new CompileService(engine);
    const result = await service.compile('!fail');

    expect(result.success).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]?.message).toContain('Undefined control sequence');
  });
});
