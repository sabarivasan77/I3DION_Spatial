import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Mail,
  HardDrive,
  Cloud,
  Send,
  Database,
  Building2,
  Trash2
} from 'lucide-react';

interface ConnectionItem {
  id: string;
  name: string;
  service: string;
  category: 'Email' | 'Storage' | 'CRM' | 'Messaging' | 'ERP';
  status: 'Connected' | 'Not Connected';
  account?: string;
  lastSynced?: string;
}

export const FlowConnectionsView: React.FC = () => {
  const [connections, setConnections] = useState<ConnectionItem[]>([
    {
      id: 'conn_gmail',
      name: 'Gmail',
      service: 'Google Mail Relay',
      category: 'Email',
      status: 'Connected',
      account: 'ravi.kumar@acme.com',
      lastSynced: '2 mins ago'
    },
    {
      id: 'conn_outlook',
      name: 'Microsoft Outlook',
      service: 'Office 365 Exchange',
      category: 'Email',
      status: 'Connected',
      account: 'enterprise@acme.com',
      lastSynced: '15 mins ago'
    },
    {
      id: 'conn_gdrive',
      name: 'Google Drive',
      service: 'Cloud Storage',
      category: 'Storage',
      status: 'Connected',
      account: 'ACME Spatial Engineering Drive',
      lastSynced: '1 hour ago'
    },
    {
      id: 'conn_dropbox',
      name: 'Dropbox',
      service: 'File Storage',
      category: 'Storage',
      status: 'Not Connected'
    },
    {
      id: 'conn_salesforce',
      name: 'Salesforce',
      service: 'Enterprise CRM',
      category: 'CRM',
      status: 'Connected',
      account: 'ACME Org Instance (NA-14)',
      lastSynced: 'Just now'
    },
    {
      id: 'conn_webhook',
      name: 'Outbound Webhooks',
      service: 'HTTP Callback Dispatcher',
      category: 'Messaging',
      status: 'Connected',
      account: '3 Active Secure Endpoints',
      lastSynced: 'Just now'
    },
    {
      id: 'conn_hubspot',
      name: 'HubSpot',
      service: 'Marketing & Sales CRM',
      category: 'CRM',
      status: 'Connected',
      account: 'HubSpot Portal 849204',
      lastSynced: '20 mins ago'
    },
    {
      id: 'conn_sap',
      name: 'SAP / ERP Connector',
      service: 'Enterprise Resource Planning',
      category: 'ERP',
      status: 'Connected',
      account: 'SAP S/4HANA Connector v2',
      lastSynced: '5 mins ago'
    }
  ]);

  const [testNotice, setTestNotice] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setConnections((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === 'Connected' ? 'Not Connected' : 'Connected';
          return {
            ...c,
            status: nextStatus,
            lastSynced: nextStatus === 'Connected' ? 'Just now' : undefined
          };
        }
        return c;
      })
    );
  };

  const handleTestConnection = (name: string) => {
    setTestNotice(`Testing connection to ${name}... Connection verified (HTTP 200 OK)`);
    setTimeout(() => setTestNotice(null), 3500);
  };

  return (
    <div className="space-y-6 pb-12 font-sans select-none">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Connections</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Manage authenticated integrations with your external tools and CRM systems.
          </p>
        </div>

        <button
          onClick={() => {
            setTestNotice('Select an authentication provider from the grid below to connect.');
            setTimeout(() => setTestNotice(null), 4000);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} className="stroke-[2.5]" />
          <span>Add Connection</span>
        </button>
      </div>

      {testNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{testNotice}</span>
        </div>
      )}

      {/* 2. Connections List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {connections.map((conn) => {
            const isConn = conn.status === 'Connected';

            return (
              <div
                key={conn.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-center gap-4">
                  {/* Service Icon */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                      conn.category === 'Email'
                        ? 'bg-rose-50 text-rose-600'
                        : conn.category === 'Storage'
                        ? 'bg-sky-50 text-sky-600'
                        : conn.category === 'CRM'
                        ? 'bg-blue-50 text-blue-600'
                        : conn.category === 'ERP'
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {conn.name[0]}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{conn.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {conn.category}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{conn.service}</span>
                      {conn.account && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">{conn.account}</span>
                        </>
                      )}
                      {conn.lastSynced && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400">Synced {conn.lastSynced}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                      isConn
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConn ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span>{conn.status}</span>
                  </span>

                  {isConn ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTestConnection(conn.name)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => handleToggle(conn.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                      >
                        Manage
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleToggle(conn.id)}
                      className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs transition active:scale-95"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
