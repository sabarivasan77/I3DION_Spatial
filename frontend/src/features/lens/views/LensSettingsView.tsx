import React from 'react';
import { useLensStore } from '../store/useLensStore';
import { Settings, Shield, Bell, Database, CheckCircle2 } from 'lucide-react';

export const LensSettingsView: React.FC = () => {
  const { vaultSyncStatus, lastSyncTime, syncNow } = useLensStore();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1200px] mx-auto font-sans select-none">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lens Application Settings</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Preferences, Vault data access synchronization, and notification triggers.
        </p>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database size={16} className="text-[#F4B400]" />
            <span>Vault Data Connection & Sync Frequency</span>
          </h2>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 text-xs block">Vault Direct Connection</span>
              <span className="text-xs text-slate-500">Connected to primary Vault tenant API endpoint.</span>
            </div>
            <button
              onClick={syncNow}
              disabled={vaultSyncStatus === 'syncing'}
              className="bg-[#F4B400] text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
            >
              {vaultSyncStatus === 'syncing' ? 'Syncing...' : 'Force Sync Now'}
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell size={16} className="text-[#F4B400]" />
            <span>Lead Notifications & Intelligence Alerts</span>
          </h2>

          <div className="space-y-2 text-xs font-semibold text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded text-[#F4B400]" />
              <span>Email notification on new high-intent lead arrival</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded text-[#F4B400]" />
              <span>Weekly executive summary report digest</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LensHelpView: React.FC = () => {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1200px] mx-auto font-sans select-none">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Help & Documentation</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Learn how to explore data, capture leads, build custom visualizations, and export reports in I3DION Spatial Lens.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">Getting Started with Lens</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            I3DION Spatial Lens consumes data directly through Vault access layers. All product views, QR scans, and WebXR AR interactions are captured and attributed to leads.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">Building Custom Visualizations</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Navigate to Visualizations, select your desired Vault dataset, choose field aggregations and chart types (Bar, Line, Donut, KPI), and save the tile to your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};
