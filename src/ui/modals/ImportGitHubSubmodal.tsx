import React, { useState } from 'react';

interface ImportGitHubSubmodalProps {
  onAppendLog: (line: string) => void;
}

const ImportGitHubSubmodal: React.FC<ImportGitHubSubmodalProps> = ({ onAppendLog }) => {
  const [url, setUrl] = useState('');
  const [branch, setBranch] = useState('main');

  const handleImport = () => {
    if (!url.trim()) {
      onAppendLog('[github] Missing repository URL.');
      return;
    }
    onAppendLog(`[github] Fetching ${url.trim()} (${branch})...`);
    onAppendLog('[github] Import simulation complete.');
  };

  return (
    <div className="space-y-3">
      <input
        className="input-field"
        placeholder="https://github.com/org/repo"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
      />
      <input
        className="input-field"
        placeholder="Branch"
        value={branch}
        onChange={(event) => setBranch(event.target.value)}
      />
      <button type="button" className="btn-secondary" onClick={handleImport}>
        Import from GitHub
      </button>
    </div>
  );
};

export default ImportGitHubSubmodal;
