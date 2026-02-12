import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Download, FileText, Loader2, MoreVertical, Play, ScrollText, Settings2 } from 'lucide-react';
import { PreviewPaneProps } from './editor-shell/contracts';

export const PdfViewer: React.FC<PreviewPaneProps> = ({
  compileState,
  pdfBlob,
  compileLog,
  pdfDarkMode,
  onCompileNow,
  onDownloadPdf,
  onTogglePdfDarkMode,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPdfUrl(null);
    }
  }, [pdfBlob]);

  const handleDownload = useCallback(() => {
    if (onDownloadPdf) {
      onDownloadPdf();
      return;
    }
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }, [onDownloadPdf, pdfBlob]);

  const isCompiling = compileState === 'compiling';

  /* ── Logs overlay ── */
  if (showLogs) {
    return (
      <div className="flex h-full w-full flex-col bg-surface-preview">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border-subtle px-3">
          <span className="text-xs font-semibold text-text-secondary">Compile Logs</span>
          <button
            type="button"
            onClick={() => setShowLogs(false)}
            className="toolbar-btn h-7 px-2 text-xs"
          >
            Back to PDF
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-3">
          <pre className="whitespace-pre-wrap font-mono text-[11px] text-text-secondary leading-relaxed">
            {compileLog || 'No compile output yet.'}
          </pre>
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (!pdfUrl) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-preview text-text-muted">
        {/* Three-dots menu (top-right) even in empty state */}
        <ThreeDotsMenu
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          pdfDarkMode={!!pdfDarkMode}
          onTogglePdfDarkMode={onTogglePdfDarkMode}
          onCompileNow={onCompileNow}
          onDownload={handleDownload}
          onShowLogs={() => { setMenuOpen(false); setShowLogs(true); }}
          hasBlob={false}
          isCompiling={isCompiling}
        />

        <FileText size={28} className="opacity-30" />
        <p className="text-xs">No PDF — compile to preview</p>
        <button
          type="button"
          onClick={onCompileNow}
          className="btn-primary h-8 gap-1.5 px-4 text-xs"
          disabled={isCompiling}
        >
          {isCompiling ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
          Compile
        </button>
      </div>
    );
  }

  /* ── PDF view ── */
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-surface-preview">
      {/* Three-dots button — top-right */}
      <ThreeDotsMenu
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        pdfDarkMode={!!pdfDarkMode}
        onTogglePdfDarkMode={onTogglePdfDarkMode}
        onCompileNow={onCompileNow}
        onDownload={handleDownload}
        onShowLogs={() => { setMenuOpen(false); setShowLogs(true); }}
        hasBlob={true}
        isCompiling={isCompiling}
      />

      {/* PDF iframe — full area */}
      <iframe
        src={pdfUrl}
        title="PDF Preview"
        className="h-full w-full border-0"
        style={{
          background: 'var(--color-surface-preview)',
          filter: pdfDarkMode ? 'invert(0.88) hue-rotate(180deg)' : undefined,
        }}
      />
    </div>
  );
};

/* ── Three-dots menu component with click-outside ── */
const ThreeDotsMenu: React.FC<{
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  pdfDarkMode: boolean;
  onTogglePdfDarkMode?: (enabled: boolean) => void;
  onCompileNow: () => void;
  onDownload: () => void;
  onShowLogs: () => void;
  hasBlob: boolean;
  isCompiling: boolean;
}> = ({ menuOpen, setMenuOpen, pdfDarkMode, onTogglePdfDarkMode, onCompileNow, onDownload, onShowLogs, hasBlob, isCompiling }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen, setMenuOpen]);

  return (
    <div className="absolute right-2 top-2 z-20" ref={ref}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="toolbar-btn h-8 w-8 p-0 bg-warm-900/80 backdrop-blur-sm border border-border-subtle"
        style={{ borderRadius: 'var(--radius-md)' }}
        title="PDF options"
        aria-haspopup="true"
        aria-expanded={menuOpen}
      >
        <MoreVertical size={14} />
      </button>
      {menuOpen && (
        <div
          className="absolute right-0 top-9 dropdown-menu w-44"
          role="menu"
        >
          <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">PDF file settings</div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onTogglePdfDarkMode?.(!pdfDarkMode);
              setMenuOpen(false);
            }}
            className="dropdown-item flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <Settings2 size={12} />
              Dark mode
            </span>
            {pdfDarkMode && <Check size={12} />}
          </button>
          <hr className="my-1 border-border-subtle" />
          <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">Download options</div>
          <button
            type="button"
            role="menuitem"
            onClick={() => { onDownload(); setMenuOpen(false); }}
            className="dropdown-item flex items-center gap-2"
            disabled={!hasBlob}
          >
            <Download size={12} />
            Download PDF
          </button>
          <hr className="my-1 border-border-subtle" />
          <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">Compilation actions</div>
          <button
            type="button"
            role="menuitem"
            onClick={() => { onCompileNow(); setMenuOpen(false); }}
            className="dropdown-item flex items-center gap-2"
            disabled={isCompiling}
          >
            {isCompiling ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {isCompiling ? 'Compiling…' : 'Compile now'}
          </button>
          <hr className="my-1 border-border-subtle" />
          <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">Compilation logs</div>
          <button
            type="button"
            role="menuitem"
            onClick={onShowLogs}
            className="dropdown-item flex items-center gap-2"
          >
            <ScrollText size={12} />
            Compile logs
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
