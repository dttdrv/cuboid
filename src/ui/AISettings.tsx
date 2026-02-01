import React, { useState, useEffect } from 'react';
import { aiService } from '../core/ai/AIService';
import { useAuth } from '../core/auth/AuthProvider';

const AISettings: React.FC = () => {
    const { masterKey } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadConfig = async () => {
            if (masterKey && isOpen) {
                const config = await aiService.loadEncryptedConfig(masterKey);
                if (config) {
                    setApiKey(config.apiKey);
                }
            }
        };
        loadConfig();
    }, [masterKey, isOpen]);

    const handleSave = async () => {
        if (!masterKey) return;
        setLoading(true);
        try {
            await aiService.saveEncryptedConfig({
                providerId: 'openai',
                apiKey: apiKey,
            }, masterKey);
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to save AI config", error);
            alert("Failed to save configuration");
        } finally {
            setLoading(false);
        }
    };

    if (!masterKey) return null; // Don't show if not logged in / unlocked

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-gray-700 text-2xl transition-transform hover:scale-105"
            >
                🤖
            </button>

            {isOpen && (
                <div className="absolute bottom-20 right-0 bg-white p-6 rounded-lg shadow-xl border border-gray-200 w-80 text-black">
                    <h3 className="font-bold text-gray-900 mb-4 flex justify-between items-center">
                        AI Settings
                        <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-1 rounded">Encrypted</span>
                    </h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            OpenAI API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full p-2 border rounded text-sm text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="sk-..."
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AISettings;
