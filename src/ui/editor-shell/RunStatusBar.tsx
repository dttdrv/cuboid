import React from 'react';
import { Bot, FileText, LayoutPanelLeft, Loader2, Play, Rows3, ScanText } from 'lucide-react';
import { RunStatusBarProps } from './contracts';

const formatMeta = (iso: string | undefined) => {
  if (!iso) return 'n/a';
  return new Date(iso).toLocaleTimeString();
};

const RunStatusBar: React.FC<RunStatusBarProps> = ({
  compileState,
  compileMeta,
  layoutMode,
  primaryPane,
  drawerOpen,
  onCompileNow,
  onPrimaryPaneChange,
  onLayoutModeChange,
  onToggleDrawer,
}) => {
  const isCompiling = compileState === 'compiling';

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/[0.08] bg-charcoal-900 px-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPrimaryPaneChange('composer')}
          className={`btn-secondary h-8 px-3 text-xs ${primaryPane === 'composer' ? 'bg-charcoal-800 text-white' : ''}`}
        >
          <Bot size={13} />
          Composer
        </button>
        <button
          type="button"
          onClick={() => onPrimaryPaneChange('editor')}
          className={`btn-secondary h-8 px-3 text-xs ${primaryPane === 'editor' ? 'bg-charcoal-800 text-white' : ''}`}
        >
          <FileText size={13} />
          Editor
        </button>
        <button
          type="button"
          onClick={() => onPrimaryPaneChange('preview')}
          className={`btn-secondary h-8 px-3 text-xs ${primaryPane === 'preview' ? 'bg-charcoal-800 text-white' : ''}`}
        >
          <ScanText size={13} />
          Preview
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onLayoutModeChange('split')} className={`btn-icon h-8 w-8 ${layoutMode === 'split' ? 'bg-charcoal-800 text-white' : ''}`} title="Split layout">
          <Rows3 size={14} />
        </button>
        <button type="button" onClick={onToggleDrawer} className={`btn-icon h-8 w-8 ${drawerOpen ? 'bg-charcoal-800 text-white' : ''}`} title="Toggle right drawer">
          <LayoutPanelLeft size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onCompileNow('manual')}
          className="btn-primary h-8 px-3 text-xs"
          disabled={isCompiling}
        >
          {isCompiling ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          Compile
        </button>
        <span className={`inline-flex h-8 items-center border px-2 text-xs ${
          compileState === 'success'
            ? 'border-success/40 bg-success/20 text-success'
            : compileState === 'error'
              ? 'border-danger/40 bg-danger/20 text-danger'
              : compileState === 'compiling'
                ? 'border-accent/40 bg-accent/20 text-accent'
                : compileState === 'queued'
                  ? 'border-warning/40 bg-warning/20 text-warning'
                  : 'border-white/[0.08] bg-charcoal-850 text-text-secondary'
        }`}>
          {compileState}
        </span>
        <span className="text-xs text-text-muted">
          last run: {formatMeta(compileMeta?.finishedAt || compileMeta?.startedAt)}
        </span>
      </div>
    </header>
  );
};

export default RunStatusBar;
