import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { RightDrawerMode } from '../../core/editor/types';
import { RightDrawerProps } from './contracts';

const TAB_LABEL: Record<RightDrawerMode, string> = {
  project_info: 'Project Info',
  comments: 'Comments',
  logs: 'Logs',
  activity: 'Activity',
};

const RightDrawer: React.FC<RightDrawerProps> = ({
  isOpen,
  mode,
  onClose,
  onModeChange,
  projectInfo,
  comments,
  commentDraft,
  activityEvents,
  compileLog,
  diagnostics,
  onCommentDraftChange,
  onAddComment,
  onJumpToLine,
}) => {
  const [query, setQuery] = useState('');

  const filteredComments = useMemo(() => {
    if (!query.trim()) return comments;
    return comments.filter((item) => item.body.toLowerCase().includes(query.trim().toLowerCase()));
  }, [comments, query]);

  if (!isOpen) return null;

  return (
    <aside className="flex min-h-0 w-[380px] flex-col border-l border-white/[0.08] bg-charcoal-900">
      <div className="flex h-12 items-center justify-between border-b border-white/[0.08] px-3">
        <div className="flex items-center gap-2">
          {(Object.keys(TAB_LABEL) as RightDrawerMode[]).map((tabMode) => (
            <button
              key={tabMode}
              type="button"
              onClick={() => onModeChange(tabMode)}
              className={`border-b px-2 py-1 text-xs ${
                mode === tabMode ? 'border-white text-white' : 'border-transparent text-text-secondary hover:text-white'
              }`}
            >
              {TAB_LABEL[tabMode]}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="btn-icon h-8 w-8">
          <X size={14} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {mode === 'project_info' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-white/[0.08] bg-charcoal-850 p-3">
              <p className="text-xs text-text-muted">Words</p>
              <p className="text-xl">{projectInfo.words}</p>
            </div>
            <div className="border border-white/[0.08] bg-charcoal-850 p-3">
              <p className="text-xs text-text-muted">Headings</p>
              <p className="text-xl">{projectInfo.headings}</p>
            </div>
            <div className="border border-white/[0.08] bg-charcoal-850 p-3">
              <p className="text-xs text-text-muted">Figures</p>
              <p className="text-xl">{projectInfo.figures}</p>
            </div>
            <div className="border border-white/[0.08] bg-charcoal-850 p-3">
              <p className="text-xs text-text-muted">Math (inline/display)</p>
              <p className="text-xl">{projectInfo.mathInline}/{projectInfo.mathDisplay}</p>
            </div>
          </div>
        )}

        {mode === 'comments' && (
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search comments"
                className="input-field h-9 pl-9"
              />
            </div>
            <textarea
              value={commentDraft}
              onChange={(event) => onCommentDraftChange(event.target.value)}
              placeholder="Add a line-anchored comment"
              className="textarea-field h-24 p-2"
            />
            <div className="flex justify-end">
              <button type="button" onClick={onAddComment} className="btn-primary h-8 px-3 text-xs">
                Add comment
              </button>
            </div>
            {filteredComments.map((comment) => (
              <article key={comment.id} className="border border-white/[0.08] bg-charcoal-850 p-3 text-sm">
                <button
                  type="button"
                  onClick={() => onJumpToLine(comment.startLine)}
                  className="text-xs text-text-muted hover:text-white"
                >
                  L{comment.startLine}-L{comment.endLine}
                </button>
                <p className="mt-1 text-text-secondary">{comment.body}</p>
              </article>
            ))}
          </div>
        )}

        {mode === 'logs' && (
          <div className="space-y-3">
            <div className="border border-white/[0.08] bg-charcoal-850 p-3 text-xs text-text-secondary">
              Diagnostics: {diagnostics.length}
              {diagnostics.slice(0, 15).map((diag) => (
                <button
                  key={diag.id}
                  type="button"
                  onClick={() => onJumpToLine(diag.line)}
                  className="mt-1 block w-full border border-transparent px-2 py-1 text-left hover:border-white/[0.08] hover:bg-charcoal-900"
                >
                  L{diag.line} · {diag.message}
                </button>
              ))}
            </div>
            <details className="border border-white/[0.08] bg-charcoal-850 p-3">
              <summary className="cursor-pointer text-sm text-text-secondary">Raw logs</summary>
              <pre className="mt-2 max-h-72 overflow-y-auto border border-white/[0.08] bg-charcoal-900 p-2 font-mono text-xs text-text-muted">
                {compileLog || '[no logs]'}
              </pre>
            </details>
          </div>
        )}

        {mode === 'activity' && (
          <div className="space-y-2">
            {activityEvents.length === 0 && <p className="text-sm text-text-muted">No activity yet.</p>}
            {activityEvents.map((event) => (
              <article key={event.id} className="border border-white/[0.08] bg-charcoal-850 p-2">
                <p className="text-xs text-text-muted">{new Date(event.timestamp).toLocaleTimeString()}</p>
                <p className="text-sm text-text-primary">{event.title}</p>
                {event.detail && <p className="text-xs text-text-secondary">{event.detail}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightDrawer;
