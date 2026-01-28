import React, { useEffect, useState } from 'react';

interface PdfViewerProps {
  pdf: Blob | null;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ pdf }) => {
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
    backgroundColor: '#f5f5f5',
    color: '#666',
    fontSize: '1rem',
  };

  const iframeStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: 'none',
  };

  if (!pdfUrl) {
    return (
      <div className="pdf-viewer-placeholder" style={placeholderStyle}>
        <p>Compile your document to see the PDF preview</p>
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