import React from 'react';
import { Workspace } from '../../core/data/types';

interface WorkspaceRowProps {
  workspace: Workspace;
  active?: boolean;
  onClick: () => void;
}

const WorkspaceRow: React.FC<WorkspaceRowProps> = ({ workspace, active = false, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-3 text-left transition-colors hover:bg-charcoal-850 ${
        active ? 'selection-pill' : 'bg-charcoal-900'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-charcoal-800 text-sm font-semibold">
            {workspace.avatar}
          </span>
          <span className="text-sm font-medium text-text-primary">{workspace.name}</span>
        </div>
        <span className="text-xs text-text-secondary">{workspace.role}</span>
      </div>
    </button>
  );
};

export default WorkspaceRow;
