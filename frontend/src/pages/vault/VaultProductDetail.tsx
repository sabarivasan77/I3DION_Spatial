import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Box,
  FileText,
  CheckCircle2,
  Share2,
  Edit3,
  Plus
} from 'lucide-react';
import { vaultApi, VaultProductDetail as ProductType } from '../../api/vaultApi';
import { VaultShareModal } from '../../components/vault/VaultShareModal';

export default function VaultProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Published');
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');

  useEffect(() => {
    if (productId) loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setIsLoading(true);
    try {
      const data = await vaultApi.getProductDetail(productId!);
      setProduct(data);
      setName(data.name);
      setCategory(data.category || 'Equipment');
      setDescription(data.description || '');
      setStatus(data.status || 'Published');
    } catch (err) {
      console.error('Failed to load product detail', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    try {
      const updated = await vaultApi.updateProduct(product.id, {
        name,
        category,
        description,
        status
      });
      setProduct({ ...product, ...updated });
      setIsEditing(false);
    } catch (err) {
      console.error('Update product failed', err);
    }
  };

  const handleAddSpec = async () => {
    if (!product || !specKey.trim() || !specVal.trim()) return;
    const currentSpecs = product.specs || {};
    const updatedSpecs = { ...currentSpecs, [specKey.trim()]: specVal.trim() };
    try {
      const updated = await vaultApi.updateProduct(product.id, { specs: updatedSpecs });
      setProduct({ ...product, specs: updated.specs });
      setSpecKey('');
      setSpecVal('');
    } catch (err) {
      console.error('Add spec failed', err);
    }
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-slate-400 font-bold">Loading product workspace...</div>;
  }

  if (!product) {
    return <div className="h-full flex items-center justify-center text-red-500 font-bold">Product not found</div>;
  }

  const tabs = ['Overview', 'Specifications', 'Assets & 3D', 'Documents', 'Catalog', 'Versions & Approvals'];

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300 select-none pb-8">
      {/* ─── HEADER BAR ───────── */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/vault/products')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft size={14} /> Back to Products
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Share2 size={14} /> Share Access
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
            >
              <Edit3 size={14} /> {isEditing ? 'Cancel Editing' : 'Edit Specifications'}
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 font-bold shadow-xs">
              <Package size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{product.name}</h1>
                <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={13} /> {product.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{product.category} • Enterprise Product Record</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TABS BAR ───────── */}
      <div className="border-b border-slate-200">
        <div className="flex overflow-x-auto no-scrollbar gap-8">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 py-3 text-xs font-bold transition ${
                activeTab === tab ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ─── EDIT OVERLAY FORM ───────── */}
      {isEditing && (
        <form onSubmit={handleSaveProduct} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Edit Product Identity & Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Title</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 font-semibold outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 font-semibold outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Publish Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 font-semibold text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Under Review">Under Review</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-20 w-full rounded-xl border border-slate-200 p-3 text-xs font-medium outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs">Save Changes</button>
          </div>
        </form>
      )}

      {/* ─── TAB CONTENTS ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'Overview' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Product Identity & Technical Description</h3>
              <p className="text-slate-600 leading-relaxed">{product.description || 'No description provided.'}</p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-1">Public Availability</span>
                  <span className="font-bold text-slate-800">{product.is_public ? 'Public' : 'Organization Private'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-1">Assigned Catalog</span>
                  <span className="font-bold text-slate-800">{product.catalog_name || 'Unassigned'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Specifications' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Technical Specifications Sheet</h3>
              </div>

              {/* Add Custom Spec Form */}
              <div className="flex gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Attribute (e.g. Max RPM)"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 3600 RPM)"
                  value={specVal}
                  onChange={(e) => setSpecVal(e.target.value)}
                  className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddSpec}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 font-bold text-white hover:bg-emerald-700 shadow-xs"
                >
                  <Plus size={14} /> Add Spec
                </button>
              </div>

              <div className="space-y-3">
                {product.specs && Object.keys(product.specs).length > 0 ? (
                  Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-100 pb-2.5">
                      <span className="font-bold text-slate-500">{k}:</span>
                      <span className="font-semibold text-slate-900">{String(v)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No custom specifications added yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Assets & 3D' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Associated 3D Models & Spatial Assets</h3>
              {product.associated_assets && product.associated_assets.length > 0 ? (
                <div className="space-y-3">
                  {product.associated_assets.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-3">
                        <Box size={20} className="text-emerald-600" />
                        <div>
                          <span className="font-bold text-slate-900 block">{a.name}</span>
                          <span className="text-[10px] text-slate-400">{a.type}</span>
                        </div>
                      </div>
                      <button onClick={() => navigate(`/vault/assets/${a.id}`)} className="text-emerald-600 font-bold hover:underline">Inspect Asset →</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No 3D models associated directly. Upload a model in Assets to link it.
                </div>
              )}
            </div>
          )}

          {activeTab === 'Documents' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Technical Datasheets & Certificates</h3>
              <p className="text-slate-500">Document manuals linked to product record CMP-900.</p>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-indigo-600" />
                  <span className="font-bold text-slate-800">CMP-900-Technical-Manual-v2.pdf</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">PDF • 4.2 MB</span>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR METADATA */}
        <div className="space-y-6 text-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">System Audit Trail</h3>
            <div className="space-y-2 text-slate-500">
              <p>Record ID: <span className="font-mono text-[10px] font-bold text-slate-700">{product.id}</span></p>
              <p>Created: <span className="font-bold text-slate-700">{new Date(product.created_at).toLocaleString()}</span></p>
              <p>Last Modified: <span className="font-bold text-slate-700">{new Date(product.updated_at).toLocaleString()}</span></p>
            </div>
          </div>
        </div>
      </div>

      <VaultShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        resourceType="dataset"
        resourceId={product.id}
        resourceName={product.name}
      />
    </div>
  );
}
