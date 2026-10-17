import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Lock, 
  Key, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface UniversalPublishProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'Catalog' | '3D Experience' | 'Product Showcase';
  itemName: string;
  versionNumber: number;
  slug: string;
  onConfirmPublish: (options: { visibility: 'PUBLIC' | 'RESTRICTED' | 'PASSCODE'; passcode?: string }) => Promise<void>;
}

export const UniversalPublishDialog: React.FC<UniversalPublishProps> = ({
  isOpen,
  onClose,
  itemType,
  itemName,
  versionNumber,
  slug,
  onConfirmPublish,
}) => {
  const [visibility, setVisibility] = useState<'PUBLIC' | 'RESTRICTED' | 'PASSCODE'>('PUBLIC');
  const [passcode, setPasscode] = useState('');
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/p/${slug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await onConfirmPublish({ visibility, passcode: visibility === 'PASSCODE' ? passcode : undefined });
      setPublishedSuccess(true);
    } catch (err) {
      console.error('Publishing ceremony error:', err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl z-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                <ShieldCheck className="h-3 w-3" />
                Publish Ceremony
              </span>
              <span className="text-xs text-slate-400 font-mono">v{versionNumber}.0 (Pinned)</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900 tracking-tight">
              Publish {itemType}: {itemName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {publishedSuccess ? (
          /* Post-Publish Success State */
          <div className="space-y-5 text-center py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 border border-green-200 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Successfully Published</h3>
              <p className="mt-1 text-xs text-slate-500">
                Snapshot v{versionNumber}.0 is live on Spatial Hub and pinned to Vault asset versions.
              </p>
            </div>

            {/* Public Link Card */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-left">
              <div className="truncate mr-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Public Experience URL</p>
                <p className="text-xs font-mono text-slate-800 truncate">{publicUrl}</p>
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Live Experience
              </a>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Pre-Publish Configuration & Validation State */
          <div className="space-y-5">
            {/* 1. Visibility Options */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">Access & Visibility</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'PUBLIC', label: 'Public Hub', icon: Globe, desc: 'Anyone with link / QR' },
                  { id: 'RESTRICTED', label: 'Organization', icon: Lock, desc: 'Company members only' },
                  { id: 'PASSCODE', label: 'Passcode', icon: Key, desc: 'Protected by PIN' },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = visibility === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVisibility(opt.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 text-blue-900' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className="h-4 w-4 mb-1.5 text-slate-500" />
                      <p className="text-xs font-semibold">{opt.label}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              {visibility === 'PASSCODE' && (
                <div className="mt-3">
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter 4-8 digit access passcode"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              )}
            </div>

            {/* 2. Pre-Publish Verification Checklist */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-700">Pre-Publish Verification Checklist</p>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span>Authoritative Vault CAD asset version pinned</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span>Mobile 3D viewer & AR fallbacks verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span>Lead capture CTA linked to Core Sales Inbox</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span>Immutable snapshot hash generated</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={publishing || (visibility === 'PASSCODE' && !passcode)}
                onClick={handlePublish}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {publishing ? 'Publishing Snapshot...' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
