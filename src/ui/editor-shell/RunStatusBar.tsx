import React from 'react';
import { Bot, Command, FileText, LayoutPanelLeft, Loader2, MessageSquare, PanelLeft, Play, ScanText, Users } from 'lucide-react';
import { EditorUiMode } from '../../core/editor/types';
import { RunStatusBarProps } from './contracts';

const formatMeta = (iso: string | undefined) => {
  if (!iso) return 'n/a';
  return new Date(iso).toLocaleTimeString();
};

const MODE_META: Array<{ id: EditorUiMode; label: string; icon: React.ReactNode }> = [
  { id: 'writing', label: 'Writing', icon: <FileText size={12} /> },
  { id: 'review', label: 'Review', icon: <MessageSquare size={12} /> },
  { id: 'collaboration', label: 'Collab', icon: <Users size={12} /> },
  { id: 'focus', label: 'Focus', icon: <Bot size={12} /> },
];

const RunStatusBar: React.FC<RunStatusBarProps> = ({
  uiMode,
  leftRailCollapsed,
  compileState,
  compileMeta,
  primaryPane,
  drawerOpen,
  onCompileNow,
  onUiModeChange,
  onToggleLeftRail,
  onOpenCommandPalette,
  onPrimaryPaneChange,
  onToggleDrawer,
}) => {
  const isCompiling = compileState === 'compiling';
  const hasIssue = compileState === 'error';
  const isQueued = compileState === 'queued';

  return (
    <header className="flex h-12 items-center justify-between border-b border-white/[0.08] bg-charcoal-900 px-3">
      <div className="flex items-center gap-1">
        <button type="button" onClick={onToggleLeftRail} className={`btn-icon h-8 w-8 ${leftRailCollapsed ? 'text-white' : ''}`} title="Toggle left rail">
          <PanelLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => onPrimaryPaneChange('composer')}
          className={`h-8 border px-2 text-xs ${primaryPane === 'composer' ? 'border-white/[0.2] bg-charcoal-800 text-white' : 'border-white/[0.08] text-text-secondary hover:text-white'}`}
        >
          <Bot size={13} />
          Ask
        </button>
        <button
          type="button"
          onClick={() => onPrimaryPaneChange('editor')}
          className={`h-8 border px-2 text-xs ${primaryPane === 'editor' ? 'border-white/[0.2] bg-charcoal-800 text-white' : 'border-white/[0.08] text-text-secondary hover:text-white'}`}
        >
          <FileText size={13} />
          Editor
        </button>
        <button
          type="button"
          onClick={() => onPrimaryPaneChange('preview')}
          className={`h-8 border px-2 text-xs ${primaryPane === 'preview' ? 'border-white/[0.2] bg-charcoal-800 text-white' : 'border-white/[0.08] text-text-secondary hover:text-white'}`}
        >
          <ScanText size={13} />
          Preview
        </button>
      </div>

      <div className="hidden items-center gap-1 lg:flex">
        {MODE_META.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onUiModeChange(mode.id)}
            className={`inline-flex h-8 items-center gap-1 border px-2 text-xs ${
              uiMode === mode.id
                ? 'border-white/[0.2] bg-charcoal-800 text-white'
                : 'border-white/[0.08] text-text-secondary hover:text-white'
            }`}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button type="button" onClick={onOpenCommandPalette} className="btn-icon h-8 w-8" title="Command palette (Ctrl/Cmd+K)">
          <Command size={14} />
        </button>
        <button type="button" onClick={onToggleDrawer} className={`btn-icon h-8 w-8 ${drawerOpen ? 'bg-charcoal-800 text-white' : ''}`} title="Toggle right drawer">
          <LayoutPanelLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => onCompileNow('manual')}
          className="btn-primary h-8 px-3 text-xs"
          disabled={isCompiling}
        >
          {isCompiling ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          Compile
        </button>
        {(isCompiling || hasIssue || isQueued) && (
          <span className={`inline-flex h-8 items-center border px-2 text-[11px] ${
            hasIssue
              ? 'border-danger/40 bg-danger/20 text-danger'
              : isQueued
                ? 'border-warning/40 bg-warning/20 text-warning'
                : 'border-accent/40 bg-accent/20 text-accent'
          }`}>
            {compileState}
          </span>
        )}
        <span className="hidden text-xs text-text-muted md:inline">
          {formatMeta(compileMeta?.finishedAt || compileMeta?.startedAt)}
        </span>
      </div>
    </header>
  );
};

export default RunStatusBar;
