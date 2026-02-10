import React, { useEffect, useState } from 'react';

interface PdfViewerProps {
  pdf: Blob | null;
  onCompileNow?: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ pdf, onCompileNow }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pdf) {
      const url = URL.createObjectURL(pdf);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPdfUrl(null);
    }
  }, [pdf]);

  if (!pdfUrl) {
    return (
      <div className="pdf-viewer-placeholder flex h-full w-full flex-col items-center justify-center gap-3 border-t border-white/[0.08] bg-[#0f1116] text-text-secondary">
        <p>Compile your document to see the PDF preview</p>
        {onCompileNow && (
          <button type="button" onClick={onCompileNow} className="btn-secondary h-9 px-4">
            Compile now
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pdf-viewer h-full w-full overflow-hidden bg-[#0f1116] p-3">
      <iframe
        src={pdfUrl}
        title="PDF Preview"
        className="pdf-iframe h-full w-full rounded-[8px] border border-white/[0.08] bg-black"
      />
    </div>
  );
};

export default PdfViewer;
