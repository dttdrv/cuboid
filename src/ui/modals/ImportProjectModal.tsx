import React, { useMemo, useState } from 'react';
import ImportZipSubmodal from './ImportZipSubmodal';
import ImportGitHubSubmodal from './ImportGitHubSubmodal';

type ImportMode = 'zip' | 'github' | null;

interface ImportProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportProjectModal: React.FC<ImportProjectModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<ImportMode>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const appendLog = (line: string) => {
    setLogs((current) => [...current, `${new Date().toLocaleTimeString()} ${line}`]);
    setShowLogs(true);
  };

  const panelTitle = useMemo(() => {
    if (mode === 'zip') return 'Import .zip';
    if (mode === 'github') return 'Import from GitHub';
    return 'Import Project';
  }, [mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-charcoal-900 p-6 shadow-2xl shadow-black/40">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{panelTitle}</h2>
          <button type="button" className="btn-pill-tertiary h-8 px-3" onClick={onClose}>
            Close
          </button>
        </div>

        {!mode && (
          <div className="space-y-2">
            <button type="button" className="btn-pill-secondary w-full justify-start px-4" onClick={() => setMode('zip')}>
              Import .zip
            </button>
            <button type="button" className="btn-pill-secondary w-full justify-start px-4" onClick={() => setMode('github')}>
              Import from GitHub
            </button>
            <button type="button" className="btn-pill-secondary w-full justify-start px-4 opacity-60" disabled>
              Import from Overleaf (coming soon)
            </button>
          </div>
        )}

        {mode === 'zip' && <ImportZipSubmodal onAppendLog={appendLog} />}
        {mode === 'github' && <ImportGitHubSubmodal onAppendLog={appendLog} />}

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <button type="button" className="btn-pill-tertiary h-8 px-3" onClick={() => setShowLogs((open) => !open)}>
            {showLogs ? 'Hide logs' : 'Show logs'}
          </button>
          {showLogs && (
            <pre className="mt-2 max-h-40 overflow-y-auto rounded-xl bg-charcoal-850 p-3 font-mono text-xs text-text-secondary">
              {logs.length ? logs.join('\n') : '[idle] No logs yet.'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportProjectModal;
