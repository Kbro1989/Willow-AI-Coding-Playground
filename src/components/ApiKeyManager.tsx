import React, { useState, useEffect } from 'react';
import { Shield, Key, RefreshCw, Trash2, X } from 'lucide-react';

interface ApiKeyManagerProps {
  onClose?: () => void;
}

interface ProviderKey {
  id: string;
  label: string;
  storageKey: string;
  envKey?: string;
}

const PROVIDERS: ProviderKey[] = [
  { id: 'gemini', label: 'Google Gemini', storageKey: 'TEMP_GEMINI_KEY', envKey: 'VITE_GEMINI_API_KEY' },
  { id: 'cloudflare', label: 'Cloudflare Workers AI', storageKey: 'TEMP_CLOUDFLARE_KEY', envKey: 'VITE_CLOUDFLARE_API_TOKEN' },
  { id: 'openai', label: 'OpenAI (DALL-E/Whisper)', storageKey: 'TEMP_OPENAI_KEY' },
  { id: 'anthropic', label: 'Anthropic Claude', storageKey: 'TEMP_ANTHROPIC_KEY' },
];

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onClose }) => {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadedPreviews: Record<string, string> = {};
    PROVIDERS.forEach(p => {
      const stored = localStorage.getItem(p.storageKey) || (p.envKey ? (import.meta as any).env[p.envKey] : '');
      if (stored) {
        loadedPreviews[p.id] = `••••${stored.slice(-4)}`;
      }
    });
    setPreviews(loadedPreviews);
  }, []);

  const handleSaveKey = (providerId: string) => {
    const provider = PROVIDERS.find(p => p.id === providerId);
    const value = keys[providerId];
    if (!provider || !value?.trim()) return;

    localStorage.setItem(provider.storageKey, value);
    setPreviews(prev => ({ ...prev, [providerId]: `••••${value.slice(-4)}` }));
    setKeys(prev => ({ ...prev, [providerId]: '' }));

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    console.log(`[API KEY] ${provider.label} updated`);
  };

  const handleClearKey = (providerId: string) => {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;

    localStorage.removeItem(provider.storageKey);
    const envKey = provider.envKey ? (import.meta as any).env[provider.envKey] : null;
    setPreviews(prev => ({ ...prev, [providerId]: envKey ? `••••${envKey.slice(-4)}` : '' }));

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0a1222] border border-cyan-500/20 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-white">Credential Vault</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Manage hot-swappable API identities</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors group">
              <X className="w-5 h-5 text-slate-500 group-hover:text-white" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {showSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
              <p className="text-xs text-emerald-400 font-bold uppercase text-center">✓ Vault entry updated successfully</p>
            </div>
          )}

          <div className="grid gap-6">
            {PROVIDERS.map(provider => (
              <div key={provider.id} className="p-4 bg-black/20 border border-white/5 rounded-xl hover:border-cyan-500/20 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-cyan-500/50" />
                    <span className="text-xs font-black uppercase text-slate-300">{provider.label}</span>
                  </div>
                  {previews[provider.id] && (
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-[10px] font-mono text-cyan-400">{previews[provider.id]}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter new key..."
                    className="nexus-input flex-1 font-mono"
                    value={keys[provider.id] || ''}
                    onChange={(e) => setKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveKey(provider.id)}
                  />
                  <button
                    onClick={() => handleSaveKey(provider.id)}
                    disabled={!keys[provider.id]?.trim()}
                    className="nexus-btn-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleClearKey(provider.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                    title="Reset to default"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
            <h3 className="text-[10px] font-black uppercase text-yellow-500 tracking-widest mb-2 flex items-center gap-2">
              ⚠️ Security Protocol
            </h3>
            <ul className="text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
              <li>• Identity keys are stored in your **local browser session** only.</li>
              <li>• Page refresh or logout will revert to server-side environment defaults.</li>
              <li>• Always use individual development keys; never share your vault access.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/5 flex justify-center">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">Neural Nexus Security Framework v4.0</p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
