import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SettingsModalProps } from '../editor-shell/contracts';

type SettingsTab = 'editor' | 'pdf';

const TABS: { key: SettingsTab; label: string }[] = [
    { key: 'editor', label: 'Editor' },
    { key: 'pdf', label: 'PDF Viewer' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    fontSize,
    onFontSizeChange,
    wordWrap,
    onWordWrapChange,
    autoCompile,
    onAutoCompileChange,
    pdfDarkMode,
    onPdfDarkModeChange,
}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('editor');

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
                    <button type="button" onClick={onClose} className="btn-icon h-8 w-8">
                        <X size={14} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="mb-5 flex gap-1 border-b border-border-subtle">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 pb-2.5 text-sm font-medium transition-colors ${activeTab === tab.key
                                    ? 'border-b-2 border-accent text-text-primary'
                                    : 'text-text-muted hover:text-text-secondary'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Editor Tab */}
                {activeTab === 'editor' && (
                    <div className="space-y-4">
                        <SettingRow label="Font Size">
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min={10}
                                    max={24}
                                    value={fontSize}
                                    onChange={(e) => onFontSizeChange(Number(e.target.value))}
                                    className="w-28 accent-accent"
                                />
                                <span className="w-8 text-right font-mono text-sm text-text-secondary tabular-nums">{fontSize}</span>
                            </div>
                        </SettingRow>

                        <SettingRow label="Word Wrap">
                            <Toggle checked={wordWrap} onChange={onWordWrapChange} />
                        </SettingRow>

                        <SettingRow label="Auto-Compile">
                            <Toggle checked={autoCompile} onChange={onAutoCompileChange} />
                        </SettingRow>
                    </div>
                )}

                {/* PDF Viewer Tab */}
                {activeTab === 'pdf' && (
                    <div className="space-y-4">
                        <SettingRow label="Dark Mode">
                            <Toggle checked={pdfDarkMode} onChange={onPdfDarkModeChange} />
                        </SettingRow>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ── Setting Row ── */
const SettingRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center justify-between border border-border-subtle bg-warm-850 px-4 py-3"
        style={{ borderRadius: 'var(--radius-md)' }}>
        <span className="text-sm text-text-secondary">{label}</span>
        {children}
    </div>
);

/* ── Toggle Switch ── */
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-10 items-center transition-colors ${checked ? 'bg-accent' : 'bg-warm-700'
            }`}
        style={{ borderRadius: 'var(--radius-pill)' }}
    >
        <span
            className={`inline-block h-4 w-4 transform bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'
                }`}
            style={{ borderRadius: 'var(--radius-pill)' }}
        />
    </button>
);

export default SettingsModal;
