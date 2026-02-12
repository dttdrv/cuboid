import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { getAIService } from '../../core/ai/AIService';
import { AIProviderId } from '../../core/ai/providerIds';
import { Send, RotateCcw, X } from 'lucide-react';

const aiService = getAIService();

interface AICommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICommandPalette: React.FC<AICommandPaletteProps> = ({ isOpen, onClose }) => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [provider, setProvider] = useState<AIProviderId>('mistral');
  const [prompt, setPrompt] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  useEffect(() => {
    if (isOpen) {
      checkConfiguration();
      setError(null);
    }
  }, [isOpen]);

  const checkConfiguration = async () => {
    try {
      const configured = await aiService.isConfigured();
      setIsConfigured(configured);
    } catch (e) {
      console.error('Failed to check config', e);
      setIsConfigured(false);
    }
  };

  const handleSaveConfig = async () => {
    setError(null);
    if (!apiKey.trim()) {
      setError('API Key cannot be empty');
      return;
    }
    try {
      const configured = await aiService.persistKey(provider, apiKey);
      setIsConfigured(configured);
      setApiKey('');
      if (!configured) {
        setError('Provider key saved, but provider runtime is not available yet.');
      }
    } catch (e) {
      setError('Failed to save API Key');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setError(null);
    setOutput('');
    setIsGenerating(true);

    try {
      const stream = aiService.generateStream(prompt);

      for await (const chunk of stream) {
        setOutput((prev) => prev + chunk);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setOutput('');
    setPrompt('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden border border-border-subtle bg-warm-900 shadow-2xl shadow-black/40"
        style={{ borderRadius: 'var(--radius-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
            <span className="text-accent">✦</span> AI Assistant
          </h2>
          <button onClick={onClose} className="btn-icon h-8 w-8">
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
              style={{ borderRadius: 'var(--radius-md)' }}>
              {error}
            </div>
          )}

          {!isConfigured ? (
            <div className="space-y-4">
              <p className="text-text-secondary">Configure your AI Provider to get started.</p>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-secondary">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as AIProviderId)}
                  className="select-field"
                >
                  <option value="mistral">Mistral</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-secondary">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="input-field"
                />
              </div>

              <button onClick={handleSaveConfig} className="btn-primary w-full">
                Save Configuration
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Output */}
              {output && (
                <div className="border border-border-subtle bg-warm-850 p-4"
                  style={{ borderRadius: 'var(--radius-md)' }}>
                  <div className="prose prose-sm max-w-none text-text-secondary prose-headings:text-text-primary prose-code:text-accent">
                    <ReactMarkdown>{output}</ReactMarkdown>
                  </div>
                  <div ref={outputEndRef} />
                </div>
              )}

              {isGenerating && !output && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-text-muted/30 border-t-accent" />
                  Generating response…
                </div>
              )}

              {/* Input */}
              <div className="space-y-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isGenerating) handleGenerate();
                    }
                  }}
                  placeholder="Ask something… (Shift+Enter for new line)"
                  className="custom-scrollbar textarea-field h-28"
                  disabled={isGenerating}
                />

                <div className="flex items-center justify-between">
                  <button
                    onClick={handleReset}
                    disabled={isGenerating || (!output && !prompt)}
                    className="btn-ghost h-9 gap-2 text-sm"
                  >
                    <RotateCcw size={13} />
                    Reset
                  </button>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="btn-primary h-9 gap-2 px-5 text-sm"
                  >
                    {isGenerating ? 'Sending…' : 'Send'}
                    <Send size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
