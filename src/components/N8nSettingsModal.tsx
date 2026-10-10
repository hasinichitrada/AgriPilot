import React, { useState } from 'react';
import {
  X,
  Workflow,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  PlugZap,
  Info
} from 'lucide-react';
import type { Language } from '../types/agri.ts';

interface N8nSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  n8nWebhookUrl: string;
  onSaveN8nUrl: (url: string) => void;
  useBuiltinAI: boolean;
  onToggleUseBuiltinAI: (useBuiltin: boolean) => void;
  language: Language;
}

export const N8nSettingsModal: React.FC<N8nSettingsModalProps> = ({
  isOpen,
  onClose,
  n8nWebhookUrl,
  onSaveN8nUrl,
  useBuiltinAI,
  onToggleUseBuiltinAI,
  language
}) => {
  const [urlInput, setUrlInput] = useState(n8nWebhookUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter an n8n webhook URL first.'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: urlInput.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: 'Connection successful! n8n webhook responded.'
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while testing connection.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveN8nUrl(urlInput.trim());
    onClose();
  };

  const samplePayloadJson = `{
  "action": "analyze_crop",
  "farmerName": "Ramesh Kumar",
  "email": "farmer@example.com",
  "location": "Warangal, Telangana",
  "crop": "Paddy (Rice)",
  "growthStage": "Flowering / పూత దశ",
  "language": "te",
  "message": "ఆకులు పసుపు రంగులోకి మారుతున్నాయి",
  "conversationId": "agri-1728491823",
  "image": {
    "data": "<BASE64_IMAGE_DATA_STRING>",
    "mimeType": "image/jpeg",
    "filename": "crop_leaf.jpg"
  }
}`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(samplePayloadJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                Backend & n8n Integration Settings
              </h3>
              <p className="text-xs text-stone-500">
                Configure your n8n workflow or AgriPilot Built-in AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-2">
              Diagnostic Engine Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onToggleUseBuiltinAI(true)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  useBuiltinAI
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Built-in AI Engine
                  </span>
                  {useBuiltinAI && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  )}
                </div>
                <p className="text-xs text-stone-500">
                  Powered by Google Gemini 3.8 Flash. Instant zero-setup analysis.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onToggleUseBuiltinAI(false)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  !useBuiltinAI
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                    <PlugZap className="w-4 h-4 text-emerald-600" />
                    Custom n8n Workflow
                  </span>
                  {!useBuiltinAI && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  )}
                </div>
                <p className="text-xs text-stone-500">
                  Connect your live n8n webhook workflow with custom agents.
                </p>
              </button>
            </div>
          </div>

          {/* Webhook URL Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-stone-800">
                n8n Webhook URL (POST Endpoint)
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setUrlInput('https://darahasini.app.n8n.cloud/webhook/90b085a3-07b9-4933-8ca8-a7d1054e9dfb/chat')}
                  className="px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium transition-colors"
                >
                  n8n Chatbot Webhook
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://darahasini.app.n8n.cloud/webhook/90b085a3-07b9-4933-8ca8-a7d1054e9dfb/chat"
                className="flex-1 rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden font-mono"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !urlInput.trim()}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-800 font-semibold text-xs rounded-xl border border-stone-300 transition-colors shrink-0 flex items-center gap-1.5"
              >
                {testing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlugZap className="w-3.5 h-3.5" />
                )}
                <span>Test Webhook</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-2.5 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* n8n Payload Specification */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-stone-500" />
                Webhook Request Format (Sent by AgriPilot)
              </span>
              <button
                type="button"
                onClick={handleCopySchema}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Payload'}</span>
              </button>
            </div>
            <pre className="bg-stone-900 text-emerald-300 p-3 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
              {samplePayloadJson}
            </pre>
          </div>
        </div>

        {/* Modal actions */}
        <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
