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
    <>
      <style>{`
        .compile-button-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .compile-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s, opacity 0.2s;
          min-width: 140px;
        }

        .compile-button:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .compile-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .compile-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .compile-error {
          color: #d32f2f;
          background-color: #ffebee;
          border: 1px solid #ffcdd2;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 13px;
          max-width: 100%;
          word-break: break-word;
        }
      `}</style>
      
      <div className="compile-button-container">
        <button
          className="compile-button"
          onClick={handleCompile}
          disabled={isCompiling}
          title="Compile PDF (Ctrl+Shift+P)"
        >
          {isCompiling ? (
            <>
              <svg
                className="compile-spinner"
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
        {error && <div className="compile-error">{error}</div>}
      </div>
    </>
  );
};

export default CompileButton;