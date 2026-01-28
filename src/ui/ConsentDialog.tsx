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

  // Styles for the Modal
  const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(2px)',
    },
    container: {
      backgroundColor: '#ffffff',
      padding: '32px',
      borderRadius: '12px',
      width: '450px',
      maxWidth: '90%',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    header: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '12px',
      color: '#1a1a1a',
      margin: 0,
    },
    description: {
      fontSize: '14px',
      color: '#555555',
      lineHeight: '1.5',
      marginBottom: '24px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '500',
      marginBottom: '8px',
      color: '#333',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      fontSize: '14px',
      border: '1px solid #d1d1d1',
      borderRadius: '6px',
      marginBottom: '24px',
      boxSizing: 'border-box' as const,
      outline: 'none',
      transition: 'border-color 0.2s',
    },
    inputFocus: {
      borderColor: '#007bff',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
    },
    button: {
      padding: '10px 18px',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '6px',
      cursor: 'pointer',
      border: 'none',
      transition: 'background-color 0.2s',
    },
    cancelButton: {
      backgroundColor: '#f0f0f0',
      color: '#333',
    },
    saveButton: {
      backgroundColor: '#007bff', // Use brand color here
      color: '#fff',
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <h2 style={styles.header}>Enable AI Assistance</h2>
        <p style={styles.description}>
          Connect to Mistral Large for intelligent editing. Your privacy is 
          protected via Zero Data Retention (ZDR).
        </p>
        
        <label style={styles.label} htmlFor="mistral-api-key">
          Mistral API Key
        </label>
        <input
          id="mistral-api-key"
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={handleInputChange}
          style={styles.input}
          onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
          onBlur={(e) => e.target.style.borderColor = '#d1d1d1'}
        />

        <div style={styles.buttonContainer}>
          <button 
            onClick={onCancel} 
            style={{ ...styles.button, ...styles.cancelButton }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            style={{ ...styles.button, ...styles.saveButton }}
          >
            Enable & Save
          </button>
        </div>
      </div>
    </div>
  );
};