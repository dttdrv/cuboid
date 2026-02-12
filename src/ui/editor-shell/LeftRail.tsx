import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, FilePlus, MessageSquare, MoreHorizontal, PanelLeftClose, Settings } from 'lucide-react';
import { LeftPaneProps } from './contracts';

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

const LeftPane: React.FC<LeftPaneProps> = ({
  mode,
  onModeChange,
  files,
  activeFilePath,
  onSelectFile,
  saveNotice,
  onAddFile,
  chatList,
  onSelectChat,
  onOpenSettings,
  onHidePane,
}) => {
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const modeMenuRef = useRef<HTMLDivElement>(null);
  const overflowMenuRef = useRef<HTMLDivElement>(null);

  const closeModeMenu = useCallback(() => setModeMenuOpen(false), []);
  const closeOverflowMenu = useCallback(() => setOverflowOpen(false), []);

  useClickOutside(modeMenuRef, closeModeMenu);
  useClickOutside(overflowMenuRef, closeOverflowMenu);

  return (
    <aside className="flex min-h-0 w-full flex-col bg-surface-rail text-text-primary">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-border-subtle px-3">
        <div className="relative" ref={modeMenuRef}>
          <button
            type="button"
            onClick={() => setModeMenuOpen((current) => !current)}
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary"
            aria-haspopup="menu"
            aria-expanded={modeMenuOpen}
          >
            {mode === 'files' ? 'FILES' : 'CHATS'}
            <ChevronDown size={12} className={`transition-transform ${modeMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {modeMenuOpen && (
            <div className="dropdown-menu absolute left-0 top-8 z-30 w-28" role="menu">
              <button
                type="button"
                role="menuitem"
                className={`dropdown-item ${mode === 'files' ? 'text-accent' : ''}`}
                onClick={() => {
                  onModeChange('files');
                  setModeMenuOpen(false);
                }}
              >
                FILES
              </button>
              <button
                type="button"
                role="menuitem"
                className={`dropdown-item ${mode === 'chats' ? 'text-accent' : ''}`}
                onClick={() => {
                  onModeChange('chats');
                  setModeMenuOpen(false);
                }}
              >
                CHATS
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {mode === 'files' && onAddFile && (
            <button type="button" onClick={onAddFile} className="toolbar-btn h-7 w-7 p-0" title="Add file">
              <FilePlus size={13} />
            </button>
          )}
          <div className="relative" ref={overflowMenuRef}>
            <button
              type="button"
              onClick={() => setOverflowOpen((current) => !current)}
              className="toolbar-btn h-7 w-7 p-0"
              title="Pane options"
              aria-haspopup="menu"
              aria-expanded={overflowOpen}
            >
              <MoreHorizontal size={13} />
            </button>
            {overflowOpen && (
              <div className="dropdown-menu absolute right-0 top-8 z-30 w-40" role="menu">
                <button type="button" role="menuitem" className="dropdown-item" onClick={closeOverflowMenu}>
                  Refresh list
                </button>
                <button type="button" role="menuitem" className="dropdown-item" onClick={closeOverflowMenu}>
                  Collapse all
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        {mode === 'files' ? (
          <div className="space-y-px px-2 py-2">
            {files.length === 0 && (
              <div className="px-2 py-10 text-center text-xs text-text-muted">No files yet</div>
            )}
            {files.map((file) => {
              const isActive = file.path === activeFilePath;
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => onSelectFile(file.path)}
                  className={`block w-full truncate px-2.5 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? 'border-l-2 border-accent bg-surface-muted font-semibold text-text-primary'
                      : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                  }`}
                  style={isActive ? { borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' } : { borderRadius: 'var(--radius-sm)' }}
                >
                  {file.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-px px-2 py-2">
            {chatList.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
                <MessageSquare size={18} className="text-text-muted opacity-40" />
                <p className="text-xs text-text-muted">No chats yet</p>
              </div>
            )}
            {chatList.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => onSelectChat?.(chat.id)}
                className="block w-full truncate rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary"
              >
                <span className="block truncate">{chat.title}</span>
                <span className="font-mono text-[10px] text-text-muted">{chat.updatedAt}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <footer className="flex h-9 shrink-0 items-center justify-between border-t border-border-subtle px-2">
        <button type="button" onClick={onOpenSettings} className="toolbar-btn h-7 w-7 p-0" title="Settings">
          <Settings size={13} />
        </button>
        <div className="flex items-center gap-1">
          <span className="max-w-[96px] truncate font-mono text-[10px] text-text-muted">{saveNotice}</span>
          <button type="button" onClick={onHidePane} className="toolbar-btn h-7 w-7 p-0" title="Hide left pane">
            <PanelLeftClose size={13} />
          </button>
        </div>
      </footer>
    </aside>
  );
};

export default LeftPane;
