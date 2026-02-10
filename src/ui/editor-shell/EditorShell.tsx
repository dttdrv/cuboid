import React from 'react';
import { Hammer, RefreshCw } from 'lucide-react';
import ArtifactPane from './ArtifactPane';
import ComposerPane from './ComposerPane';
import LeftRail from './LeftRail';
import PdfViewer from '../PdfViewer';
import { EditorShellProps } from './contracts';

const EditorShell: React.FC<EditorShellProps> = ({
  leftRail,
  composerPane,
  artifactPane,
  previewPane,
}) => {
  return (
    <div className="min-h-screen bg-page-bg p-2 text-text-primary">
      <div className="mx-auto grid h-[calc(100vh-1rem)] max-w-[1720px] min-w-0 grid-cols-1 gap-2 lg:grid-cols-[260px_minmax(0,1fr)_minmax(360px,42%)]">
        <div className="panel min-h-0 overflow-hidden">
          <LeftRail {...leftRail} />
        </div>

        <section className="panel relative min-h-0 overflow-hidden">
          <ArtifactPane {...artifactPane} />
          <ComposerPane {...composerPane} />
        </section>

        <section className="panel flex min-h-0 flex-col overflow-hidden">
          <header className="flex h-11 items-center justify-between border-b border-border-subtle px-3">
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <RefreshCw size={14} className={previewPane.compileState === 'compiling' ? 'animate-spin' : ''} />
              <span>{previewPane.compileState === 'compiling' ? 'Compiling' : 'Preview'}</span>
            </div>
            <button type="button" onClick={previewPane.onCompileNow} className="btn-secondary h-8 px-2 text-xs">
              <Hammer size={14} />
              Compile
            </button>
          </header>

          <div className="min-h-0 flex-1">
            <PdfViewer pdf={previewPane.pdfBlob} onCompileNow={previewPane.onCompileNow} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default EditorShell;
