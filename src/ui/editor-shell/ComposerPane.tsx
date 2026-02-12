import React, { useEffect, useRef } from 'react';
import { ImagePlus, Loader2, Send, Trash2, X } from 'lucide-react';
import { ComposerPaneProps } from './contracts';

const ComposerPane: React.FC<ComposerPaneProps> = ({
  prompt,
  aiEnabled,
  aiBusy,
  aiProviderLabel,
  aiModelLabel,
  messages,
  attachedImageName,
  onPromptChange,
  onPromptSubmit,
  onToggleAi,
  onClearMessages,
  onAttachImage,
  onRemoveImage,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const label = aiModelLabel ? `${aiProviderLabel} · ${aiModelLabel}` : aiProviderLabel;
  const placeholder = aiEnabled ? 'Ask anything…' : 'AI disabled';

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const maxHeight = 4 * 20; // 4 lines × ~20px each
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
    }
  }, [prompt]);

  return (
    <div
      className="pointer-events-auto absolute bottom-3 left-3 right-3 z-20"
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      {/* Meta bar */}
      <div className="mb-1.5 flex items-center justify-between px-1 font-mono text-[11px] text-text-muted">
        <span className="truncate">{label}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClearMessages}
            disabled={messages.length === 0}
            className="toolbar-btn h-6 w-6 p-0"
            title="Clear conversation"
          >
            <Trash2 size={11} />
          </button>
          <button
            type="button"
            onClick={onToggleAi}
            className={`toolbar-btn h-6 px-2 font-mono text-[10px] transition-all ${aiEnabled ? 'toolbar-btn-active' : ''
              }`}
          >
            {aiEnabled ? 'AI ON' : 'AI OFF'}
          </button>
        </div>
      </div>

      {/* Message history */}
      {messages.length > 0 && (
        <div
          className="custom-scrollbar mb-2 max-h-48 overflow-y-auto border border-border-subtle bg-surface-composer/90 p-2 text-xs"
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          <div className="space-y-2">
            {messages.slice(-8).map((message) => (
              <div
                key={message.id}
                className={`whitespace-pre-wrap border p-2.5 ${message.role === 'user'
                  ? 'border-border-active bg-surface-muted text-text-primary'
                  : 'border-border-subtle bg-panel-bg text-text-secondary'
                  }`}
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {message.role}
                </div>
                {message.content}
              </div>
            ))}
            {/* Typing indicator */}
            {aiBusy && (
              <div
                className="flex items-center gap-2 border border-border-subtle bg-panel-bg p-2.5 text-text-muted"
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                <Loader2 size={12} className="animate-spin" />
                <span className="text-[10px] uppercase tracking-wider">Thinking…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Attached image */}
      {attachedImageName && (
        <div
          className="mb-1.5 flex items-center justify-between border border-border-subtle bg-panel-bg px-2.5 py-1.5 font-mono text-[11px] text-text-secondary"
          style={{ borderRadius: 'var(--radius-sm)' }}
        >
          <span className="truncate">{attachedImageName}</span>
          <button type="button" onClick={onRemoveImage} className="text-text-muted hover:text-text-primary cursor-pointer">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex items-end gap-1 border border-border-subtle bg-surface-composer/95 px-2 py-1.5 transition-colors focus-within:border-accent/50"
        style={{ borderRadius: 'var(--radius-md)' }}
      >
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          disabled={!aiEnabled || aiBusy}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onPromptSubmit();
            }
          }}
          placeholder={placeholder}
          rows={1}
          className="min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-1 text-sm leading-5 text-text-primary outline-none placeholder:text-text-muted"
          style={{ maxHeight: 80 }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
            onAttachImage(file);
            if (fileRef.current) {
              fileRef.current.value = '';
            }
          }}
        />
        <button
          type="button"
          disabled={!aiEnabled || aiBusy}
          onClick={() => fileRef.current?.click()}
          className="toolbar-btn h-7 w-7 shrink-0 p-0"
          title="Attach image"
        >
          <ImagePlus size={14} />
        </button>
        <button
          type="button"
          onClick={onPromptSubmit}
          disabled={!aiEnabled || aiBusy || !prompt.trim()}
          className="ml-0.5 inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center bg-accent text-white transition-all hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
          style={{ borderRadius: 'var(--radius-sm)' }}
          title="Send (Enter)"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
};

export default ComposerPane;

