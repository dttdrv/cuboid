import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Command, Play, Settings, Sparkles, PanelLeft } from 'lucide-react';
import { CommandPaletteProps } from './contracts';

interface CommandItem {
    id: string;
    label: string;
    shortcut?: string;
    icon: React.ReactNode;
    action: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    onCompileNow,
    onToggleAi,
    onOpenSettings,
    onToggleLeftPane,
}) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const commands: CommandItem[] = useMemo(() => [
        { id: 'compile', label: 'Compile Now', shortcut: 'Ctrl+Shift+B', icon: <Play size={14} />, action: () => { onCompileNow(); onClose(); } },
        { id: 'toggle-ai', label: 'Toggle AI', icon: <Sparkles size={14} />, action: () => { onToggleAi(); onClose(); } },
        { id: 'settings', label: 'Open Settings', icon: <Settings size={14} />, action: () => { onOpenSettings(); onClose(); } },
        { id: 'toggle-left', label: 'Toggle Left Pane', shortcut: 'Ctrl+B', icon: <PanelLeft size={14} />, action: () => { onToggleLeftPane(); onClose(); } },
    ], [onCompileNow, onToggleAi, onOpenSettings, onToggleLeftPane, onClose]);

    const filtered = useMemo(() => {
        if (!query.trim()) return commands;
        const q = query.toLowerCase();
        return commands.filter((c) => c.label.toLowerCase().includes(q));
    }, [commands, query]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[selectedIndex]) filtered[selectedIndex].action();
        } else if (e.key === 'Escape') {
            onClose();
        }
    }, [filtered, selectedIndex, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md border border-border-subtle bg-warm-900 shadow-2xl shadow-black/50 overflow-hidden"
                style={{ borderRadius: 'var(--radius-lg)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search input */}
                <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
                    <Command size={14} className="text-text-muted" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search commands…"
                        className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                    />
                    <kbd className="border border-border-subtle bg-warm-850 px-1.5 py-0.5 font-mono text-[10px] text-text-muted"
                        style={{ borderRadius: 'var(--radius-sm)' }}>
                        Esc
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                    {filtered.length === 0 && (
                        <p className="px-3 py-6 text-center text-sm text-text-muted">No commands found</p>
                    )}
                    {filtered.map((cmd, i) => (
                        <button
                            key={cmd.id}
                            type="button"
                            onClick={cmd.action}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${i === selectedIndex
                                    ? 'bg-accent/10 text-accent'
                                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                                }`}
                            style={{ borderRadius: 'var(--radius-sm)' }}
                            onMouseEnter={() => setSelectedIndex(i)}
                        >
                            <span className="flex h-7 w-7 items-center justify-center text-text-muted">
                                {cmd.icon}
                            </span>
                            <span className="flex-1">{cmd.label}</span>
                            {cmd.shortcut && (
                                <kbd className="border border-border-subtle bg-warm-850 px-1.5 py-0.5 font-mono text-[10px] text-text-muted"
                                    style={{ borderRadius: 'var(--radius-sm)' }}>
                                    {cmd.shortcut}
                                </kbd>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
