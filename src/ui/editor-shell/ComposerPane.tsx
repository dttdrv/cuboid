import React from 'react';
import { Image, Send, Waves } from 'lucide-react';
import { ComposerPaneProps } from './contracts';

const ComposerPane: React.FC<ComposerPaneProps> = ({
  prompt,
  selection,
  actions,
  deferredImageToLatex,
  deferredVoiceMode,
  onPromptChange,
  onPromptSubmit,
  onApplyAction,
  onRejectAction,
  onViewAction,
}) => {
  return (
    <section className="flex min-h-0 flex-col border-r border-white/[0.08] bg-charcoal-950">
      <div className="border-b border-white/[0.08] px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-text-muted">Composer</p>
        <p className="mt-1 text-sm text-text-secondary">Agent-led drafting with explicit user approval.</p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="border border-white/[0.08] bg-charcoal-900 p-3 text-xs text-text-muted">
          Selection anchor: L{selection.startLine}-L{selection.endLine}
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-text-muted">Proposed actions</p>
          {actions.length === 0 && (
            <div className="border border-white/[0.08] bg-charcoal-900 p-3 text-sm text-text-muted">
              Ask for a change to generate an action plan.
            </div>
          )}
          {actions.map((action) => (
            <article key={action.id} className="border border-white/[0.08] bg-charcoal-900 p-3">
              <p className="text-xs text-text-muted">{action.intent} · L{action.startLine}-L{action.endLine}</p>
              <p className="mt-1 text-sm text-text-primary">{action.title}</p>
              <p className="mt-1 text-xs text-text-secondary">{action.summary}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => onViewAction(action.id)} className="btn-secondary h-8 px-2 text-xs">
                  View
                </button>
                <button type="button" onClick={() => onApplyAction(action.id)} className="btn-primary h-8 px-2 text-xs">
                  Apply
                </button>
                <button type="button" onClick={() => onRejectAction(action.id)} className="btn-secondary h-8 px-2 text-xs">
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.08] bg-charcoal-900 p-3">
        <div className="flex items-center gap-2">
          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="Ask the agent to draft, revise, or debug."
            className="textarea-field h-20 flex-1 p-2"
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1 border border-white/[0.08] px-2 py-1">
              <Image size={12} />
              Image to LaTeX {deferredImageToLatex ? '(later)' : ''}
            </span>
            <span className="inline-flex items-center gap-1 border border-white/[0.08] px-2 py-1">
              <Waves size={12} />
              Voicemode {deferredVoiceMode ? '(later)' : ''}
            </span>
          </div>
          <button type="button" onClick={onPromptSubmit} className="btn-primary h-9 px-4 text-xs">
            <Send size={14} />
            Run
          </button>
        </div>
      </div>
    </section>
  );
};

export default ComposerPane;
