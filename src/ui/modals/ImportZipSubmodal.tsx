import React from 'react';

interface ImportZipSubmodalProps {
  onAppendLog: (line: string) => void;
}

const ImportZipSubmodal: React.FC<ImportZipSubmodalProps> = ({ onAppendLog }) => {
  const handleImport = () => {
    onAppendLog('[zip] Opening file picker...');
    onAppendLog('[zip] Import simulation complete.');
  };

  return (
    <div className="space-y-3">
      <div className="border border-white/[0.08] bg-charcoal-850 p-4 text-sm text-text-secondary">
        Drag and drop a <code>.zip</code> here or use file picker.
      </div>
      <button type="button" className="btn-secondary" onClick={handleImport}>
        Select .zip file
      </button>
    </div>
  );
};

export default ImportZipSubmodal;
