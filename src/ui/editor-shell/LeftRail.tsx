import React from 'react';
import { ChevronLeft, FileCode2 } from 'lucide-react';
import { LeftRailProps } from './contracts';

const LeftRail: React.FC<LeftRailProps> = ({
  projectName,
  documentTitle,
  sections,
  saveNotice,
  onBackToProjects,
  onJumpToLine,
}) => {
  return (
    <aside className="flex min-h-0 w-72 flex-col border-r border-white/[0.08] bg-charcoal-950">
      <div className="border-b border-white/[0.08] p-4">
        <button type="button" onClick={onBackToProjects} className="btn-ghost h-8 px-2 text-xs">
          <ChevronLeft size={14} />
          Back to projects
        </button>
        <p className="mt-4 truncate text-2xl font-semibold text-text-primary">{projectName}</p>
      </div>

      <div className="border-b border-white/[0.08] p-4">
        <p className="text-xs uppercase tracking-wide text-text-muted">Document</p>
        <div className="mt-2 flex items-center gap-2 border border-white/[0.08] bg-charcoal-900 px-3 py-2 text-sm text-text-secondary">
          <FileCode2 size={14} />
          <span className="truncate">{documentTitle}</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Outline</p>
        <div className="space-y-1">
          {sections.length === 0 && <p className="text-xs text-text-muted">No sections yet.</p>}
          {sections.map((section) => (
            <button
              key={`${section.line}-${section.title}`}
              type="button"
              onClick={() => onJumpToLine(section.line)}
              className="w-full border border-transparent px-2 py-1 text-left text-xs text-text-secondary transition-colors hover:border-white/[0.08] hover:bg-charcoal-900 hover:text-white"
            >
              L{section.line} · {section.title}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.08] px-4 py-3 text-xs text-text-muted">
        <div className="flex items-center justify-between">
          <span>Connected</span>
          <span>{saveNotice}</span>
        </div>
      </div>
    </aside>
  );
};

export default LeftRail;
