import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { getAIService } from '../../core/ai/AIService';
import { AIProviderId } from '../../core/ai/providerIds';

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

  // Auto-scroll to bottom of output
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  useEffect(() => {
    if (isOpen) {
      checkConfiguration();
      // Reset state on open if desired, or keep history
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
      setApiKey(''); // Clear memory of key
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden border border-white/[0.08] bg-charcoal-900 shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-charcoal-850 p-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-text-primary">
            <span className="text-accent">+</span> AI Assistant
          </h2>
          <button
            onClick={onClose}
            className="btn-icon h-8 w-8"
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
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
                  className="select-field px-3"
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
                  className="input-field px-3"
                />
              </div>

              <button
                onClick={handleSaveConfig}
                className="btn-primary w-full"
              >
                Save Configuration
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Output Display */}
              {output && (
                <div className="min-h-[100px] border border-white/[0.08] bg-charcoal-850 p-4">
                  <div className="prose prose-sm max-w-none text-text-secondary">
                    <ReactMarkdown>{output}</ReactMarkdown>
                  </div>
                  <div ref={outputEndRef} />
                </div>
              )}

              {isGenerating && !output && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="animate-spin">⟳</span> Generating response...
                </div>
              )}

              {/* Input Area */}
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
                  placeholder="Ask something... (Shift+Enter for new line)"
                  className="custom-scrollbar textarea-field h-32"
                  disabled={isGenerating}
                />

                <div className="flex items-center justify-between">
                  <button
                    onClick={handleReset}
                    disabled={isGenerating || (!output && !prompt)}
                    className="btn-ghost h-9 px-3 text-sm disabled:cursor-not-allowed"
                  >
                    Reset / Clear
                  </button>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className={`inline-flex h-10 items-center gap-2 border px-6 font-medium transition-colors
                      ${isGenerating || !prompt.trim()
                        ? 'cursor-not-allowed border-charcoal-700 bg-charcoal-700 text-text-muted'
                        : 'border-accent bg-accent text-white hover:bg-accent-strong'
                      }`}
                  >
                    {isGenerating ? 'Sending...' : 'Send'}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
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
