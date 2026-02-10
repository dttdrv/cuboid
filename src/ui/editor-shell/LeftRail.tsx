import React from 'react';
import { ArrowLeft, Hammer } from 'lucide-react';
import { LeftRailProps } from './contracts';

const LeftRail: React.FC<LeftRailProps> = ({
  projectName,
  documentTitle,
  sections,
  saveNotice,
  onCompileNow,
  onBackToProjects,
  onJumpToLine,
}) => {
  return (
    <aside className="flex min-h-0 w-full flex-col">
      <header className="flex h-11 items-center justify-between border-b border-border-subtle px-3">
        <button
          type="button"
          onClick={onBackToProjects}
          className="inline-flex max-w-full items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={14} />
          <span className="truncate">Projects</span>
        </button>
        <button type="button" onClick={onCompileNow} className="btn-secondary h-8 px-2 text-xs">
          <Hammer size={14} />
          Compile
        </button>
      </header>

      <div className="border-b border-border-subtle px-3 py-2">
        <p className="truncate text-sm font-medium text-text-primary">{projectName}</p>
        <p className="truncate text-xs text-text-muted">{documentTitle}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Files</p>
          <button
            type="button"
            onClick={() => onJumpToLine(1)}
            className="w-full border border-border-subtle bg-surface-muted px-2 py-1 text-left text-sm text-text-primary"
          >
            {documentTitle}
          </button>
        </div>

        <div className="mt-4 space-y-1 border-t border-border-subtle pt-3">
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Outline</p>
          {sections.map((section) => (
            <button
              key={`${section.line}-${section.title}`}
              type="button"
              onClick={() => onJumpToLine(section.line)}
              className="block w-full truncate px-2 py-1 text-left text-xs text-text-secondary hover:bg-surface-muted hover:text-text-primary"
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      <footer className="border-t border-border-subtle px-3 py-2 text-xs text-text-muted">{saveNotice}</footer>
    </aside>
  );
};

export default LeftRail;
