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

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  };

  const placeholderStyle: React.CSSProperties = {
    ...containerStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    color: '#b6b6b6',
    fontSize: '1rem',
  };

  const iframeStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: 'none',
  };

  if (!pdfUrl) {
    return (
      <div className="pdf-viewer-placeholder flex-col gap-3" style={placeholderStyle}>
        <p>Compile your document to see the PDF preview</p>
        {onCompileNow && (
          <button type="button" onClick={onCompileNow} className="btn-pill-secondary h-9 px-4">
            Compile now
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pdf-viewer" style={containerStyle}>
      <iframe
        src={pdfUrl}
        title="PDF Preview"
        className="pdf-iframe"
        style={iframeStyle}
      />
    </div>
  );
};

export default PdfViewer;
