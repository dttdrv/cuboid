import React from 'react';
import { ExternalLink, Maximize2 } from 'lucide-react';
import MonacoEditor from '../editor/MonacoEditor';
import PdfViewer from '../PdfViewer';
import { ArtifactPaneProps } from './contracts';

const toMonacoSeverity = (severity: 'error' | 'warning' | 'note') => {
  if (severity === 'error') return 8;
  if (severity === 'warning') return 4;
  return 2;
};

const ArtifactPane: React.FC<ArtifactPaneProps> = ({
  primaryPane,
  content,
  onContentChange,
  documentTitle,
  diagnostics,
  revealLine,
  onSelectionChange,
  pdfBlob,
  onCompileNow,
  inlineHunks,
  onResolveInlineHunk,
}) => {
  const previewOptions = (
    <div className="flex items-center gap-2">
      <select className="select-field h-8 w-28 px-2 py-1 text-xs">
        <option>Zoom to fit</option>
        <option>100%</option>
        <option>150%</option>
      </select>
      <button type="button" className="btn-icon h-8 w-8" title="Fullscreen">
        <Maximize2 size={14} />
      </button>
      <button type="button" className="btn-icon h-8 w-8" title="Open in new window">
        <ExternalLink size={14} />
      </button>
    </div>
  );

  return (
    <section className="flex min-h-0 flex-col bg-charcoal-950">
      <div className="flex h-12 items-center justify-between border-b border-white/[0.08] px-3">
        <p className="truncate border border-white/[0.14] px-3 py-1 text-sm text-text-primary">{documentTitle}</p>
        {primaryPane === 'preview' && previewOptions}
      </div>
      <div className="min-h-0 flex-1">
        {primaryPane === 'editor' && (
          <MonacoEditor
            value={content}
            onChange={onContentChange}
            revealLine={revealLine}
            onSelectionChange={(start, end) => onSelectionChange(start, end)}
            markers={diagnostics.map((item) => ({
              startLineNumber: item.line,
              endLineNumber: item.line,
              startColumn: 1,
              endColumn: 2,
              message: item.message,
              severity: toMonacoSeverity(item.severity),
            }))}
            inlineHunks={inlineHunks}
            onResolveHunk={onResolveInlineHunk}
          />
        )}
        {primaryPane === 'preview' && <PdfViewer pdf={pdfBlob} onCompileNow={onCompileNow} />}
        {primaryPane === 'composer' && (
          <div className="flex h-full items-center justify-center border-t border-white/[0.08] bg-charcoal-900 text-text-muted">
            Composer is active. Switch to editor or preview to inspect artifacts.
          </div>
        )}
      </div>
    </section>
  );
};

export default ArtifactPane;
