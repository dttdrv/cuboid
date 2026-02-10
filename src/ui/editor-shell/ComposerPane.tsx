import React from 'react';
import { Send } from 'lucide-react';
import { ComposerPaneProps } from './contracts';

const ComposerPane: React.FC<ComposerPaneProps> = ({
  prompt,
  onPromptChange,
  onPromptSubmit,
}) => {
  return (
    <div className="pointer-events-auto absolute bottom-3 right-3 z-20 w-[280px] max-w-[calc(100%-1.5rem)]">
      <div className="flex h-9 items-center border border-border-subtle bg-surface-rail px-2">
        <input
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onPromptSubmit();
            }
          }}
          placeholder="AI prompt"
          className="h-full min-w-0 flex-1 border-0 bg-transparent px-1 text-xs text-text-primary outline-none placeholder:text-text-muted"
        />
        <button type="button" onClick={onPromptSubmit} className="btn-secondary h-7 px-2 text-xs">
          <Send size={12} />
        </button>
      </div>
    </div>
  );
};

export default ComposerPane;
