import React from 'react';
import { Hammer, RefreshCw } from 'lucide-react';
import MonacoEditor from '../editor/MonacoEditor';
import { ArtifactPaneProps } from './contracts';

const toMonacoSeverity = (severity: 'error' | 'warning' | 'note') => {
  if (severity === 'error') return 8;
  if (severity === 'warning') return 4;
  return 2;
};

const ArtifactPane: React.FC<ArtifactPaneProps> = ({
  content,
  onContentChange,
  documentTitle,
  diagnostics,
  revealLine,
  onSelectionChange,
  onCompileNow,
  inlineHunks,
  onResolveInlineHunk,
}) => {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex h-11 items-center justify-between border-b border-border-subtle px-3">
        <div className="flex items-center gap-2 text-sm text-text-primary">
          <span className="truncate">{documentTitle}</span>
        </div>
        <button type="button" onClick={onCompileNow} className="btn-secondary h-8 px-2 text-xs">
          <RefreshCw size={14} />
          <Hammer size={14} />
          Compile
        </button>
      </header>

      <div className="min-h-0 flex-1">
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
      </div>
    </section>
  );
};

export default ArtifactPane;
