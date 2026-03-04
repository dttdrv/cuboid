import React from 'react';
import { Workspace } from '../../core/data/types';

interface WorkspaceRowProps {
  workspace: Workspace;
  active?: boolean;
  onClick: (workspaceId: string) => void;
}

// ⚡ Bolt: Wrapped in React.memo() to prevent unnecessary re-renders when parent states
// (like selectedWorkspaceId) change but this specific row's props remain the same.
// Impact: Reduces re-renders of list items by O(N).
const WorkspaceRow: React.FC<WorkspaceRowProps> = React.memo(({ workspace, active = false, onClick }) => {
  return (
    <button
      type="button"
      onClick={() => onClick(workspace.id)}
      className={`w-full border border-white/[0.08] px-4 py-3 text-left transition-colors hover:bg-charcoal-850 ${
        active ? 'selection-row' : 'bg-charcoal-900'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center border border-white/[0.08] bg-charcoal-800 text-sm font-semibold">
            {workspace.avatar}
          </span>
          <span className="text-sm font-medium text-text-primary">{workspace.name}</span>
        </div>
        <span className="text-xs text-text-secondary">{workspace.role}</span>
      </div>
    </button>
  );
});

export default WorkspaceRow;
