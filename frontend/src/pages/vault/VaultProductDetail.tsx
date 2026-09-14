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
  Plus,
  Link2,
  Trash2,
  Inbox,
  ListOrdered,
  X
} from 'lucide-react';
import {
  vaultApi,
  VaultProductDetail as ProductType,
  ProductFullRelationships,
  VaultAsset,
  VaultProduct
} from '../../api/vaultApi';
import { VaultShareModal } from '../../components/vault/VaultShareModal';

export default function VaultProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [relationships, setRelationships] = useState<ProductFullRelationships | null>(null);
  const [availableAssets, setAvailableAssets] = useState<VaultAsset[]>([]);
  const [availableProducts, setAvailableProducts] = useState<VaultProduct[]>([]);
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

  // Attach Asset Modal state
  const [isAttachAssetModalOpen, setIsAttachAssetModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedAssetRole, setSelectedAssetRole] = useState('PRIMARY_MODEL');

  // Add Related Product Modal state
  const [isAddRelatedModalOpen, setIsAddRelatedModalOpen] = useState(false);
  const [targetProductId, setTargetProductId] = useState('');
  const [relationshipType, setRelationshipType] = useState('compatible');
  const [relNotes, setRelNotes] = useState('');

  useEffect(() => {
    if (productId) loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    setIsLoading(true);
    try {
      const [prodData, relData, assetsData, prodsData] = await Promise.all([
        vaultApi.getProductDetail(productId!),
        vaultApi.getProductRelationships(productId!).catch(() => null),
        vaultApi.getAssets().catch(() => []),
        vaultApi.getProducts().catch(() => [])
      ]);

      setProduct(prodData);
      setRelationships(relData);
      setAvailableAssets(assetsData);
      setAvailableProducts(prodsData.filter(p => p.id !== productId));

      setName(prodData.name);
      setCategory(prodData.category || 'Equipment');
      setDescription(prodData.description || '');
      setStatus(prodData.status || 'Published');
    } catch (err) {
      console.error('Failed to load product detail & relationships', err);
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

  const handleAttachAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !selectedAssetId) return;
    try {
      await vaultApi.attachProductAsset(productId, {
        asset_id: selectedAssetId,
        asset_role: selectedAssetRole
      });
      setIsAttachAssetModalOpen(false);
      loadProductData();
    } catch (err) {
      console.error('Attach asset failed', err);
    }
  };

  const handleDetachAsset = async (mapId: string) => {
    if (!productId) return;
    try {
      await vaultApi.detachProductAsset(productId, mapId);
      loadProductData();
    } catch (err) {
      console.error('Detach asset failed', err);
    }
  };

  const handleAddRelatedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !targetProductId) return;
    try {
      await vaultApi.addProductRelationship(productId, {
        target_product_id: targetProductId,
        relationship_type: relationshipType,
        notes: relNotes
      });
      setIsAddRelatedModalOpen(false);
      loadProductData();
    } catch (err) {
      console.error('Add related product failed', err);
    }
  };

  const handleRemoveRelationship = async (relId: string) => {
    if (!productId) return;
    try {
      await vaultApi.removeProductRelationship(productId, relId);
      loadProductData();
    } catch (err) {
      console.error('Remove relationship failed', err);
    }
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-slate-400 font-bold">Loading product relationship workspace...</div>;
  }

  if (!product) {
    return <div className="h-full flex items-center justify-center text-red-500 font-bold">Product record not found</div>;
  }

  const tabs = [
    'Overview',
    'Specifications',
    `Assets (${relationships?.attached_assets.length || 0})`,
    `Related Products (${relationships?.related_products.length || 0})`,
    `Catalogs (${relationships?.catalogs.length || 0})`,
    `Enquiries (${relationships?.enquiries.length || 0})`
  ];

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

          {activeTab.startsWith('Assets') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Attached Spatial & Media Assets</h3>
                  <p className="text-slate-500 mt-0.5">Persisted relational links between Vault Assets and Product record.</p>
                </div>
                <button
                  onClick={() => setIsAttachAssetModalOpen(true)}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700 shadow-xs"
                >
                  <Plus size={14} /> Attach Asset
                </button>
              </div>

              {relationships?.attached_assets && relationships.attached_assets.length > 0 ? (
                <div className="space-y-3">
                  {relationships.attached_assets.map(a => (
                    <div key={a.map_id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <Box size={20} className="text-emerald-600" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{a.name}</span>
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase">
                              {a.asset_role}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">{a.type} • {(a.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => navigate(`/vault/assets/${a.asset_id}`)} className="text-emerald-600 font-bold hover:underline">
                          View Asset →
                        </button>
                        <button onClick={() => handleDetachAsset(a.map_id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Detach Asset">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No assets currently attached. Click "Attach Asset" to link 3D models or media files.
                </div>
              )}
            </div>
          )}

          {activeTab.startsWith('Related Products') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Inter-Product Relationships</h3>
                  <p className="text-slate-500 mt-0.5">Compatible accessories, replacements, and product variants.</p>
                </div>
                <button
                  onClick={() => setIsAddRelatedModalOpen(true)}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700 shadow-xs"
                >
                  <Plus size={14} /> Link Product
                </button>
              </div>

              {relationships?.related_products && relationships.related_products.length > 0 ? (
                <div className="space-y-3">
                  {relationships.related_products.map(r => (
                    <div key={r.rel_id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <Link2 size={18} className="text-indigo-600" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{r.target_product_name}</span>
                            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                              {r.relationship_type}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">{r.category} • {r.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => navigate(`/vault/products/${r.target_product_id}`)} className="text-indigo-600 font-bold hover:underline">
                          Inspect Product →
                        </button>
                        <button onClick={() => handleRemoveRelationship(r.rel_id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Remove Link">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No inter-product relationships established yet.
                </div>
              )}
            </div>
          )}

          {activeTab.startsWith('Catalogs') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Catalog Memberships & Sequence Orders</h3>
              {relationships?.catalogs && relationships.catalogs.length > 0 ? (
                <div className="space-y-3">
                  {relationships.catalogs.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <ListOrdered size={20} className="text-emerald-600" />
                        <div>
                          <span className="font-bold text-slate-900 block">{c.name}</span>
                          <span className="text-[10px] text-slate-400">Display Rank: #{c.display_order + 1}</span>
                        </div>
                      </div>
                      <button onClick={() => navigate('/vault/catalogs')} className="text-emerald-600 font-bold hover:underline">
                        Manage Catalog Sequence →
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  This product is not currently listed in any publication catalog.
                </div>
              )}
            </div>
          )}

          {activeTab.startsWith('Enquiries') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Linked Customer Enquiries & Sales Leads</h3>
              {relationships?.enquiries && relationships.enquiries.length > 0 ? (
                <div className="space-y-3">
                  {relationships.enquiries.map(e => (
                    <div key={e.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{e.customer_name} ({e.company || 'Private'})</span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          {e.status}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{e.message || 'No enquiry text body.'}</p>
                      <span className="text-[10px] text-slate-400 block pt-1">{e.email} • {new Date(e.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No inquiries recorded for this product yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* SIDEBAR METADATA */}
        <div className="space-y-6 text-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Entity Audit & Relations</h3>
            <div className="space-y-2.5 text-slate-500">
              <div className="flex justify-between">
                <span>Record UUID:</span>
                <span className="font-mono text-[10px] font-bold text-slate-700">{product.id.slice(0, 18)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Attached Assets:</span>
                <span className="font-bold text-slate-800">{relationships?.attached_assets.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Related Products:</span>
                <span className="font-bold text-slate-800">{relationships?.related_products.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Catalogs:</span>
                <span className="font-bold text-slate-800">{relationships?.catalogs.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Inquiries:</span>
                <span className="font-bold text-slate-800">{relationships?.enquiries.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ATTACH ASSET MODAL ───────── */}
      {isAttachAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form onSubmit={handleAttachAsset} className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Attach Vault Asset to Product</h3>
              <button type="button" onClick={() => setIsAttachAssetModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Vault Asset</label>
              <select
                required
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 font-semibold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="">-- Choose Asset --</option>
                {availableAssets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Asset Role</label>
              <select
                value={selectedAssetRole}
                onChange={(e) => setSelectedAssetRole(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 font-semibold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="PRIMARY_MODEL">Primary 3D Model</option>
                <option value="SECONDARY_MODEL">Secondary 3D Model</option>
                <option value="THUMBNAIL">Thumbnail Image</option>
                <option value="HERO_IMAGE">Hero Image</option>
                <option value="GALLERY_IMAGE">Gallery Image</option>
                <option value="TECHNICAL_IMAGE">Technical Diagram</option>
                <option value="MANUAL">User Manual (PDF)</option>
                <option value="DATASHEET">Datasheet (PDF)</option>
                <option value="CERTIFICATE">Compliance Certificate</option>
                <option value="AR_MODEL">AR Optimized Asset</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsAttachAssetModalOpen(false)} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs">Attach Asset</button>
            </div>
          </form>
        </div>
      )}

      {/* ─── ADD RELATED PRODUCT MODAL ───────── */}
      {isAddRelatedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form onSubmit={handleAddRelatedProduct} className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Link Related Product</h3>
              <button type="button" onClick={() => setIsAddRelatedModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Product</label>
              <select
                required
                value={targetProductId}
                onChange={(e) => setTargetProductId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 font-semibold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="">-- Choose Product --</option>
                {availableProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Relationship Type</label>
              <select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 font-semibold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="accessory">Accessory</option>
                <option value="compatible">Compatible Product</option>
                <option value="replacement">Replacement Part</option>
                <option value="alternative">Alternative Variant</option>
                <option value="recommended">Recommended Upgrade</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Notes / Description</label>
              <input
                type="text"
                placeholder="Optional link details..."
                value={relNotes}
                onChange={(e) => setRelNotes(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsAddRelatedModalOpen(false)} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs">Establish Link</button>
            </div>
          </form>
        </div>
      )}

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
