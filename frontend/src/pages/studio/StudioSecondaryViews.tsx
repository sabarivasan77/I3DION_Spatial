import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, GitBranch, Settings, HelpCircle, Shield, Database } from 'lucide-react';
import { studioApi, StudioProject } from '../../api/studioApi';

export const StudioDrafts: React.FC = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<StudioProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const data = await studioApi.getProjects();
      setDrafts(data.filter(p => (p.status || '').toLowerCase() === 'draft' || (p.status || '').toLowerCase() === 'in review'));
    } catch (err) {
      console.error('Failed to load drafts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-900">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          Active Drafts ({drafts.length})
        </h1>
        <p className="text-sm text-slate-500 mt-1">Unpublished catalog compositions and work-in-progress layouts.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-200/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs shadow-xs">
          No active drafts.
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map(d => (
            <div
              key={d.id}
              onClick={() => navigate(`/omni-studio/builder/${d.id}`)}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 transition cursor-pointer flex items-center justify-between shadow-xs"
            >
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-1">{d.description || 'No description'}</p>
                <div className="text-[11px] text-slate-400 mt-1">Updated {new Date(d.updated_at).toLocaleDateString()}</div>
              </div>
              <button className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition shadow-xs">
                Resume Editing
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const StudioVersions: React.FC = () => {
  const [projects, setProjects] = useState<StudioProject[]>([]);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      const data = await studioApi.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load version history:', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-900">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-indigo-600" />
          Version Control & History
        </h1>
        <p className="text-sm text-slate-500 mt-1">Audit log of catalog project publishing iterations.</p>
      </div>

      <div className="space-y-4">
        {projects.map(p => (
          <div key={p.id} className="p-5 bg-white rounded-xl border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                <p className="text-xs text-slate-500">Current version tag: v{p.version}</p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold">
                Last Published: {p.last_published_version ? `v${p.last_published_version}` : 'Never'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Created on {new Date(p.created_at).toLocaleDateString()} • Last edited {new Date(p.updated_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StudioSettings: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 text-slate-900">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          Studio Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">Omni Studio workspace settings and Vault integration rules.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            Spatial Vault Source of Truth Binding
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Omni Studio relies on Spatial Vault as its authoritative 3D model and product specification repository. Asset binary duplication is disabled to maintain catalog data consistency across the ecosystem.
          </p>
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-indigo-800 font-mono font-bold">
            STATUS: CONNECTED & VERIFIED (TENANT RESTRICTED)
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            Tenant Isolation & Permission Scoping
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Catalog drafts, version histories, and published outputs are strictly partitioned by organization ID. Direct URL tampering is blocked by application-level entitlements.
          </p>
        </div>
      </div>
    </div>
  );
};

export const StudioSupport: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 text-slate-900">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-indigo-600" />
          Omni Studio Help & Guide
        </h1>
        <p className="text-sm text-slate-500 mt-1">Documentation for creating visual spatial catalogs.</p>
      </div>

      <div className="space-y-4 text-sm text-slate-600">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
          <h3 className="font-bold text-slate-900">1. Select Assets from Vault</h3>
          <p className="text-xs text-slate-500">
            Open the Studio Catalog Builder and click the "Vault Assets" panel. Select verified 3D models and product items to populate your visual sections.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
          <h3 className="font-bold text-slate-900">2. Arrange & Inspect Layouts</h3>
          <p className="text-xs text-slate-500">
            Use the Center Canvas to reorder sections, adjust card grids, and configure custom CTA buttons or product descriptions using the Right Inspector.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
          <h3 className="font-bold text-slate-900">3. Publish & Distribute</h3>
          <p className="text-xs text-slate-500">
            Preview on Desktop, Tablet, or Mobile devices. Run pre-publish validation and deploy to Spatial Hub with version tracking and QR access.
          </p>
        </div>
      </div>
    </div>
  );
};
