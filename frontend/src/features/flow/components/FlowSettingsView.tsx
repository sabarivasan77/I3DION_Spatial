import React, { useState } from 'react';
import {
  Save,
  CheckCircle2,
  Bell,
  Shield,
  Clock,
  RotateCcw,
  Trash2,
  Key
} from 'lucide-react';

export const FlowSettingsView: React.FC = () => {
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [saveHistory, setSaveHistory] = useState(true);
  const [retryOnFailure, setRetryOnFailure] = useState(true);
  const [maxRetries, setMaxRetries] = useState(3);
  const [timeoutSeconds, setTimeoutSeconds] = useState(60);
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToast('Workflow automation settings saved successfully.');
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="space-y-6 pb-12 font-sans select-none max-w-4xl">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Automation Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Configure default execution, notification policies, and failure retry parameters.
        </p>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* 2. Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Execution Policies */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Execution Policies &amp; Resilience
          </h2>

          <div className="space-y-4 text-xs">
            {/* Enable Error Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">Enable Error Notifications</div>
                <div className="text-slate-400 mt-0.5">
                  Send immediate in-app and email alerts when a step encounters a critical failure.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnableNotifications(!enableNotifications)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                  enableNotifications ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* Save Run History */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <div className="font-semibold text-slate-800">Save Run History &amp; Step Payloads</div>
                <div className="text-slate-400 mt-0.5">
                  Persist granular step input/output telemetry for auditing and replay capabilities.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSaveHistory(!saveHistory)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                  saveHistory ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* Retry on Failure */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <div className="font-semibold text-slate-800">Auto-Retry on Transient Network Errors</div>
                <div className="text-slate-400 mt-0.5">
                  Automatically retry outbound HTTP webhooks and CRM sync with exponential backoff.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRetryOnFailure(!retryOnFailure)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                  retryOnFailure ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          </div>
        </div>

        {/* Numeric Limits */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Execution Limits
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Max Auto-Retries</label>
              <input
                type="number"
                min={1}
                max={5}
                value={maxRetries}
                onChange={(e) => setMaxRetries(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Step Timeout (seconds)</label>
              <input
                type="number"
                min={10}
                max={300}
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
          >
            <Save size={15} />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
