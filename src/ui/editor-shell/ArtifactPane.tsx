import React from 'react';
import { X } from 'lucide-react';
import MonacoEditor from '../editor/MonacoEditor';
import { EditorPaneProps } from './contracts';

const toMonacoSeverity = (severity: 'error' | 'warning' | 'note') => {
  if (severity === 'error') return 8;
  if (severity === 'warning') return 4;
  return 2;
};

const ArtifactPane: React.FC<EditorPaneProps> = ({
  content,
  onContentChange,
  openTabs,
  activeTabId,
  onTabChange,
  onTabClose,
  diagnostics,
  revealLine,
  onSelectionChange,
  onCompileNow: _onCompileNow,
  inlineHunks,
  onResolveInlineHunk,
}) => {
  return (
    <section className="flex h-full min-h-0 flex-col bg-surface-editor">
      {/* ── Tab row ── */}
      <header className="flex h-10 shrink-0 items-center border-b border-border-subtle">
        <div className="flex h-full min-w-0 flex-1 items-stretch overflow-x-auto custom-scrollbar">
          {openTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                className={`group relative flex shrink-0 items-center gap-1.5 border-r border-border-subtle px-3 text-xs transition-colors cursor-pointer select-none ${isActive
                  ? 'bg-surface-editor text-text-primary'
                  : 'bg-surface-rail text-text-muted hover:text-text-secondary hover:bg-surface-muted'
                  }`}
                onClick={() => onTabChange(tab.id)}
                onMouseDown={(e) => { if (e.button === 1 && openTabs.length > 1) { e.preventDefault(); onTabClose(tab.id); } }}
              >
                {/* Active indicator — accent bottom border */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                )}
                {/* Modified indicator */}
                {tab.isModified && (
                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
                )}
                <span className="font-mono truncate max-w-[120px]">{tab.label}</span>
                {openTabs.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
                    className="flex h-4 w-4 items-center justify-center text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-text-primary"
                    title="Close tab"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </header>

      {/* ── Editor body ── */}
      <div className="min-h-0 flex-1" style={{ paddingBottom: 52 }}>
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
