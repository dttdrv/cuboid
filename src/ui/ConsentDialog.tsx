import React, { useState, ChangeEvent } from 'react';

interface ConsentDialogProps {
  isOpen: boolean;
  onSave: (apiKey: string) => void;
  onCancel: () => void;
}

export const ConsentDialog: React.FC<ConsentDialogProps> = ({
  isOpen,
  onSave,
  onCancel,
}) => {
  const [apiKey, setApiKey] = useState<string>('');

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(apiKey);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-charcoal-900 p-6 shadow-2xl shadow-black/40">
        <h2 className="text-xl font-semibold text-text-primary">Enable AI Assistance</h2>
        <p className="mt-3 text-sm text-text-secondary">
          Connect to Mistral Large for intelligent editing. Your privacy is 
          protected via Zero Data Retention (ZDR).
        </p>
        
        <label className="mt-6 block text-sm text-text-secondary" htmlFor="mistral-api-key">
          Mistral API Key
        </label>
        <input
          id="mistral-api-key"
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={handleInputChange}
          className="input-pill mt-2"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="btn-pill-tertiary"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="btn-pill-primary"
          >
            Enable & Save
          </button>
        </div>
      </div>
    </div>
  );
};
