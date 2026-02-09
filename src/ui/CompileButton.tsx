import React, { useState, useEffect, useCallback } from 'react';

interface CompileButtonProps {
  onCompile: () => Promise<Blob | null>;
  onPdfReady: (pdf: Blob) => void;
}

export const CompileButton: React.FC<CompileButtonProps> = ({ onCompile, onPdfReady }) => {
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompile = useCallback(async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    setError(null);

    try {
      const pdf = await onCompile();
      if (pdf) {
        onPdfReady(pdf);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setIsCompiling(false);
    }
  }, [isCompiling, onCompile, onPdfReady]);

  // Keyboard shortcut: Ctrl+Shift+P
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        handleCompile();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCompile]);

  return (
    <div className="flex flex-col items-start gap-2">
        <button
          className="btn-pill-secondary min-w-36"
          onClick={handleCompile}
          disabled={isCompiling}
          title="Compile PDF (Ctrl+Shift+P)"
        >
          {isCompiling ? (
            <>
              <svg
                className="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="31.416"
                  strokeDashoffset="10.472"
                />
              </svg>
              <span>Compiling...</span>
            </>
          ) : (
            'Compile PDF'
          )}
        </button>
        {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</div>}
      </div>
  );
};

export default CompileButton;
