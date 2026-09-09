import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Archive,
  ArrowRight,
  Box,
  Camera,
  Check,
  Copy,
  Download,
  Edit2,
  ExternalLink,
  FileText,
  Globe2,
  Image,
  QrCode,
  Mail,
  RefreshCw,
  ScanLine,
  Send,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  View,
  X,
  Info,
  Expand
} from 'lucide-react';
import ThreeProduct, { xrStore } from '../components/ThreeProduct';
import { Badge, Button, Card, PageHeader, SectionTitle } from '../components/ui';
import { useToast } from '../components/Toast';
import { api, ApiClientError, checkBackendHealth, uploadFileWithProgress, type ProductRecord, type ProductPayload } from '../services/api';
import { Tracker } from '../services/Tracker';
import { useAuthStore } from '../store/authStore';
import { cx } from '../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartLeadCapture } from '../components/SmartLeadCapture';
import { ExitIntentSurvey } from '../components/ExitIntentSurvey';

type WizardStep = 1 | 2 | 3;

function safeUrl(url?: string | null) {
  return url || '';
}

function parseSpecs(text: string) {
  const specs: Record<string, string> = {};
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) return;
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (key && value) specs[key] = value;
    });
  return specs;
}

function specsToText(specs: Record<string, string>) {
  return Object.entries(specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

function formatMetric(value?: number) {
  return Number(value ?? 0).toLocaleString();
}

function readSessionId(scope: string) {
  const key = `i3dion:${scope}:session`;
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const created = `${scope}-${crypto.randomUUID()}`;
  sessionStorage.setItem(key, created);
  return created;
}

function sendPublicEvent(payload: {
  slug: string;
  eventType: string;
  metadata?: Record<string, unknown>;
  durationSeconds?: number;
  sessionId?: string;
}) {
  const visitorId = Tracker.getVisitorId();
  const body = JSON.stringify({
    ...payload,
    visitorId,
    metadata: {
      ...payload.metadata,
      visitorId
    }
  });
  const endpoint = `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'}/public/analytics/events`;
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
    return;
  }
  void fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  });
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', variant = 'danger', onConfirm, onCancel, loading }: {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className={cx('rounded-xl p-2', variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600')}>
            <Trash2 size={22} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
            {loading ? 'Working...' : confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Edit Product Modal ────────────────────────────────────────────────────────

function EditProductModal({ product, token, onSave, onClose }: {
  product: ProductRecord;
  token: string;
  onSave: (updated: ProductRecord) => void;
  onClose: () => void;
}) {
  const { success, error: showError } = useToast();
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [description, setDescription] = useState(product.description ?? '');
  const [specText, setSpecText] = useState(specsToText(product.specs ?? {}));
  const [status, setStatus] = useState<ProductRecord['status']>(product.status);
  const [isPublic, setIsPublic] = useState(product.is_public ?? false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Product name is required';
    if (!category.trim()) nextErrors.category = 'Category is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const payload: ProductPayload = {
        name: name.trim(),
        category: category.trim(),
        description: description.trim() || undefined,
        status,
        isPublic,
        specs: parseSpecs(specText),
        imageUrl: product.image_url ?? undefined,
        modelUrl: product.model_url ?? undefined,
        documentUrl: product.document_url ?? undefined,
        videoUrl: product.video_url ?? undefined,
      };
      const updated = await api.updateProduct(token, product.id, payload);
      success('Product updated', `${updated.name} has been saved.`);
      onSave(updated);
    } catch (err) {
      showError('Update failed', err instanceof ApiClientError ? err.message : 'Unexpected error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-950">Edit Product</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Product Name *</span>
            <input
              className={cx('mt-2 h-12 w-full rounded-xl border px-4 text-sm outline-none transition', errors.name ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-500')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name ? <p className="mt-1 text-xs text-red-500">{errors.name}</p> : null}
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Category *</span>
            <input
              className={cx('mt-2 h-12 w-full rounded-xl border px-4 text-sm outline-none transition', errors.category ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-500')}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            {errors.category ? <p className="mt-1 text-xs text-red-500">{errors.category}</p> : null}
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Description</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none transition focus:border-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Specifications</span>
            <textarea
              className="mt-2 min-h-32 w-full rounded-xl border border-slate-200 p-4 text-sm font-mono outline-none transition focus:border-blue-500"
              value={specText}
              onChange={(e) => setSpecText(e.target.value)}
              placeholder="Material: Steel&#10;Weight: 380kg&#10;Voltage: 440V"
            />
            <p className="mt-1 text-xs text-slate-400">One spec per line in the form <code>Label: Value</code></p>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Status</span>
            <select
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductRecord['status'])}
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Archived">Archived</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Spatial Hub Visibility</span>
            <select
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500"
              value={isPublic ? 'public' : 'private'}
              onChange={(e) => setIsPublic(e.target.value === 'public')}
            >
              <option value="private">Private Workspace</option>
              <option value="public">Public Spatial Hub</option>
            </select>
          </label>
          <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
              <Check size={16} />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

import { QRCodeGenerator } from '../components/QRCodeGenerator';

// ─── QR Panel ─────────────────────────────────────────────────────────────────

function ProductQrPanel({ product }: { product: ProductRecord }) {
  const { success, error: showError } = useToast();
  const qr = product.qr;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(product.public_url ?? '');
      success('Copied product URL', product.public_url ?? '');
    } catch {
      showError('Copy failed', 'Your browser blocked clipboard access.');
    }
  }

  if (!qr) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-amber-50 p-2 text-amber-600">
            <QrCode size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-950">QR code is pending</h3>
            <p className="mt-1 text-sm text-slate-500">
              Upload the GLB model to generate the QR code automatically.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <SectionTitle title="Product QR" meta={`Generated ${qr.generated_at ? new Date(qr.generated_at).toLocaleString() : 'recently'}`} />
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <QRCodeGenerator url={product.public_url ?? ''} className="w-full" size={200} />
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Public URL</p>
            <p className="mt-2 break-all font-medium text-slate-900">{product.public_url}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={copyUrl}><Copy size={16} />Copy Link</Button>
          </div>
          <p className="text-sm text-slate-500">
            Scan this QR with any camera app to open the mobile AR product experience.
          </p>
        </div>
      </div>
    </Card>
  );
}

// ─── Metrics Card ──────────────────────────────────────────────────────────────

function ProductMetricsCard({ product }: { product: ProductRecord }) {
  const stats = [
    { label: 'Product Created', value: product.created_at ? new Date(product.created_at).toLocaleDateString() : 'Pending' },
    { label: 'QR Generated', value: product.qr_generated_at ? new Date(product.qr_generated_at).toLocaleDateString() : 'Pending' },
    { label: 'QR Downloads', value: formatMetric(product.qr_downloads) },
    { label: 'Total Scans', value: formatMetric(product.total_scans) },
    { label: 'Product Views', value: formatMetric(product.product_views) },
    { label: 'AR Launches', value: formatMetric(product.ar_launch_count) },
  ];

  return (
    <Card className="p-6">
      <SectionTitle title="Dashboard Metrics" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className="mt-2 text-lg font-bold text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Product Management Page ───────────────────────────────────────────────────

export function ProductManagementPage() {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingConfirm, setDeletingConfirm] = useState(false);
  const [statusChanging, setStatusChanging] = useState<string | null>(null);

  const selected = useMemo(
    () => products.find((product) => product.id === selectedId) ?? products[0] ?? null,
    [products, selectedId],
  );

  async function loadProducts() {
    if (!token) return;
    setLoading(true);
    try {
      const rows = await api.listProducts(token);
      setProducts(rows);
      setSelectedId((current) => current ?? rows[0]?.id ?? null);
    } catch (err) {
      showError('Could not load products', err instanceof ApiClientError ? err.message : 'Unexpected API failure');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, [token]);

  async function refresh() {
    if (!token) return;
    await loadProducts();
  }

  async function handleDelete(id: string) {
    if (!token) return;
    setDeletingId(id);
    try {
      await api.deleteProduct(token, id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
      success('Product deleted', 'The product and all its assets have been removed.');
    } catch (err) {
      showError('Delete failed', err instanceof ApiClientError ? err.message : 'Unexpected error');
    } finally {
      setDeletingId(null);
      setDeletingConfirm(false);
    }
  }

  async function handleStatusChange(id: string, status: ProductRecord['status']) {
    if (!token) return;
    setStatusChanging(id);
    try {
      const updated = await api.patchProductStatus(token, id, status);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      success('Status updated', `Product is now ${status}.`);
    } catch (err) {
      showError('Status change failed', err instanceof ApiClientError ? err.message : 'Unexpected error');
    } finally {
      setStatusChanging(null);
    }
  }

  async function openQrDownload(type: 'qr_preview' | 'qr_download') {
    if (!selected || !token) return;
    try {
      await api.trackEvent(token, {
        eventType: type,
        productId: selected.id,
        metadata: { source: 'admin-dashboard', slug: selected.slug },
      });
    } catch {
      // tracking should not block the workflow
    }
  }

  return (
    <div className="space-y-8">
      {deletingConfirm && selected ? (
        <ConfirmDialog
          title="Delete Product"
          message={`Are you sure you want to permanently delete "${selected.name}"? This will also remove all uploaded assets, the QR code, and analytics data.`}
          confirmLabel="Delete Product"
          variant="danger"
          loading={!!deletingId}
          onConfirm={() => void handleDelete(selected.id)}
          onCancel={() => setDeletingConfirm(false)}
        />
      ) : null}

      {editingProduct && token ? (
        <EditProductModal
          product={editingProduct}
          token={token}
          onSave={(updated) => {
            setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setEditingProduct(null);
          }}
          onClose={() => setEditingProduct(null)}
        />
      ) : null}

      <PageHeader
        title="Product QR Experience"
        eyebrow="Create products, upload assets, and manage QR, mobile, and AR experiences."
        action={(
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button onClick={() => navigate('/products/upload')}>
              <Upload size={18} />
              Create Product
            </Button>
          </div>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex h-56 items-center justify-center text-slate-400">
              <RefreshCw className="mr-3 animate-spin" size={20} />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="p-8">
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <Box className="mx-auto text-slate-300" size={40} />
                <h3 className="mt-4 text-lg font-bold text-slate-900">No products yet</h3>
                <p className="mt-2 text-sm text-slate-500">Create the first product and upload its GLB to auto-generate the QR code.</p>
                <Button className="mt-6" onClick={() => navigate('/products/upload')}>
                  <Upload size={18} />
                  Create Product
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">QR</th>
                    <th className="px-6 py-4">Scans</th>
                    <th className="px-6 py-4">AR</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className={cx('cursor-pointer transition hover:bg-slate-50', selected?.id === product.id ? 'bg-blue-50/70' : '')}
                      onClick={() => setSelectedId(product.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                            {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><Box size={20} /></div>}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">{product.name}</p>
                            <p className="text-xs text-slate-500">{product.category}</p>
                            <p className="text-xs text-slate-400">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><Badge>{product.status}</Badge></td>
                      <td className="px-6 py-4">
                        {product.qr ? <Badge>Ready</Badge> : <span className="text-sm text-amber-600">Pending</span>}
                      </td>
                      <td className="px-6 py-4">{formatMetric(product.total_scans)}</td>
                      <td className="px-6 py-4">{formatMetric(product.ar_launch_count)}</td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            title="Edit product"
                            onClick={() => setEditingProduct(product)}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
                          >
                            <Edit2 size={15} />
                          </button>
                          {product.status !== 'Published' ? (
                            <button
                              title="Publish"
                              disabled={statusChanging === product.id}
                              onClick={() => void handleStatusChange(product.id, 'Published')}
                              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <Globe2 size={15} />
                            </button>
                          ) : (
                            <button
                              title="Archive"
                              disabled={statusChanging === product.id}
                              onClick={() => void handleStatusChange(product.id, 'Archived')}
                              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                            >
                              <Archive size={15} />
                            </button>
                          )}
                          <button
                            title="Delete product"
                            onClick={() => { setSelectedId(product.id); setDeletingConfirm(true); }}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {selected ? (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="relative h-52 bg-slate-900">
                {selected.image_url ? (
                  <img src={selected.image_url} alt={selected.name} className="h-full w-full object-cover opacity-80" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
                    <Sparkles size={40} />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 to-transparent p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Selected Product</p>
                  <h2 className="mt-1 text-xl font-bold">{selected.name}</h2>
                  <p className="mt-0.5 text-sm text-slate-300">{selected.category}</p>
                </div>
              </div>
              <div className="space-y-3 p-5">
                <div className="grid gap-2">
                  <div className="flex justify-between rounded-2xl bg-slate-50 p-3 text-sm">
                    <span className="text-slate-500">Status</span>
                    <Badge>{selected.status}</Badge>
                  </div>
                  <div className="flex justify-between rounded-2xl bg-slate-50 p-3 text-sm">
                    <span className="text-slate-500">Model</span>
                    <span className="font-medium">{selected.model_url ? '✅ GLB uploaded' : '⚠️ Missing'}</span>
                  </div>
                  {selected.public_url && (
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <p className="text-xs text-slate-400 mb-1">Public URL</p>
                      <p className="break-all font-medium text-slate-900 text-xs">{selected.public_url}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="secondary" className="flex-1" onClick={() => setEditingProduct(selected)}>
                    <Edit2 size={15} />Edit
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={() => navigate(`/product-experience?id=${selected.id}`)}>
                    <View size={15} />Preview
                  </Button>
                  {selected.qr ? (
                    <>
                      <a href={selected.qr.png_url} download={`${selected.slug ?? selected.id}.png`} onClick={() => void openQrDownload('qr_download')}>
                        <Button variant="secondary"><Download size={15} />PNG</Button>
                      </a>
                      <a href={selected.public_url ?? '#'} target="_blank" rel="noreferrer">
                        <Button variant="secondary"><ExternalLink size={15} />Open</Button>
                      </a>
                    </>
                  ) : null}
                </div>
                {selected.status !== 'Published' ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={statusChanging === selected.id}
                    onClick={() => void handleStatusChange(selected.id, 'Published')}
                  >
                    <Globe2 size={15} />
                    {statusChanging === selected.id ? 'Publishing...' : 'Publish Product'}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={statusChanging === selected.id}
                    onClick={() => void handleStatusChange(selected.id, 'Archived')}
                  >
                    <Archive size={15} />
                    {statusChanging === selected.id ? 'Archiving...' : 'Archive Product'}
                  </Button>
                )}
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => setDeletingConfirm(true)}
                >
                  <Trash2 size={15} />Delete Product
                </Button>
              </div>
            </Card>
            <ProductMetricsCard product={selected} />
            <ProductQrPanel product={selected} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Upload Wizard ─────────────────────────────────────────────────────────────

export function ProductUploadWizardPage() {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [step, setStep] = useState<WizardStep>(1);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [model, setModel] = useState<File | null>(null);
  const [usdzModel, setUsdzModel] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [specText, setSpecText] = useState('Material: Steel\nVoltage: 440V\nWeight: 380kg');
  const [status, setStatus] = useState<ProductRecord['status']>('Draft');
  const [isPublic, setIsPublic] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [backendHealth, setBackendHealth] = useState<{
    reachable: boolean;
    ok: boolean;
    status: number;
    dbConnected: boolean;
    storageAvailable: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBackendHealth(null);
    void checkBackendHealth().then((ok) => {
      if (!cancelled) setBackendHealth(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function createDraft(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Product name is required';
    if (!category.trim()) nextErrors.category = 'Category is required';
    if (!description.trim()) nextErrors.description = 'Description is required';
    if (Object.keys(parseSpecs(specText)).length === 0) nextErrors.specs = 'Add at least one specification line (e.g. Material: Steel)';
    if (!thumbnail) nextErrors.thumbnail = 'Select a thumbnail image';
    if (!model) nextErrors.model = 'Select a GLB model file — required for QR and AR';
    if (images.length === 0) nextErrors.images = 'Upload at least one product image';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (!backendHealth?.ok) {
      showError('Backend unavailable', 'Start the backend and PostgreSQL before creating products.');
      return;
    }

    if (!token) return;
    setCreating(true);
    try {
      const created = await api.createProduct(token, {
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        status,
        isPublic,
        specs: parseSpecs(specText),
      });
      setProduct(created);
      setStep(2);
      success('Product created', `${created.name} is ready for asset uploads.`);
    } catch (err) {
      showError('Product creation failed', err instanceof ApiClientError ? err.message : 'Unexpected API failure');
    } finally {
      setCreating(false);
    }
  }

  async function uploadAsset(file: File, assetType: string): Promise<ProductRecord | null> {
    if (!token || !product) return null;
    if (!backendHealth?.ok) {
      showError('Backend unavailable', 'Start the backend and PostgreSQL before uploading assets.');
      return null;
    }
    setUploading((current) => ({ ...current, [assetType]: 1 }));
    try {
      const uploaded = await uploadFileWithProgress({
        token,
        file,
        productId: product.id,
        assetType,
        onProgress: (progress) => setUploading((current) => ({ ...current, [assetType]: progress })),
      });
      // The response now always includes the refreshed product with QR
      const refreshed = (uploaded.product as ProductRecord | null) ?? await api.getProduct(token, product.id);
      setProduct(refreshed);
      success(`Uploaded ${assetType}`, file.name);
      return refreshed;
    } catch (err) {
      let errorMessage = 'Could not upload asset';
      if (err instanceof ApiClientError) {
        errorMessage = err.message;
        if (err.details && typeof err.details === 'object' && 'originalError' in err.details) {
          errorMessage += `: ${(err.details as any).originalError}`;
        }
      }
      showError('Upload failed', errorMessage);
      return null;
    } finally {
      setUploading((current) => ({ ...current, [assetType]: 0 }));
    }
  }

  async function uploadAllAndFinish() {
    if (!product || !token) return;
    // Upload in order: thumbnail, images, documents, model (model last to trigger QR)
    if (thumbnail) await uploadAsset(thumbnail, 'thumbnail');
    for (const img of images) await uploadAsset(img, 'image');
    for (const doc of documents) await uploadAsset(doc, 'document');
    let finalProduct: ProductRecord | null = product;
    if (model) {
      finalProduct = await uploadAsset(model, 'model');
    }
    if (usdzModel) {
      finalProduct = await uploadAsset(usdzModel, 'usdz_model');
    }
    // Navigate to step 3 regardless — show QR status
    if (finalProduct?.qr) {
      setStep(3);
    } else {
      success('Assets uploaded', 'Product is ready. QR will appear when model upload completes.');
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Create Product"
        eyebrow="Complete the form, then upload assets. The QR code is generated automatically after the GLB model is uploaded."
        action={(
          <Button variant="secondary" onClick={() => navigate('/products')}>
            Back to products
          </Button>
        )}
      />

      <Card className="p-4 space-y-4">
        <div className={cx(
          'rounded-2xl border p-3 text-sm',
          backendHealth === null
            ? 'border-slate-200 bg-slate-50 text-slate-600'
            : backendHealth.reachable && backendHealth.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700',
        )}>
          {backendHealth === null
            ? '⏳ Checking backend connection...'
            : !backendHealth.reachable
              ? 'ℹ️ Running in Preview Mode (Demo State). Data will save locally.'
              : backendHealth.ok
                ? '✅ Backend is online. Ready to create products and upload assets.'
                : backendHealth.dbConnected
                  ? '⚠️ Backend is online, but storage check failed.'
                  : 'ℹ️ Running in Preview Mode. PostgreSQL is unconfigured on server; changes will operate in local interactive mode.'}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { n: 1, title: 'Product Details', desc: 'Name, category, description, specs' },
            { n: 2, title: 'Upload Assets', desc: 'Thumbnail, images, GLB, USDZ, documents' },
            { n: 3, title: 'QR Ready', desc: 'Download, scan, and open AR' },
          ].map((item) => (
            <button
              key={item.n}
              type="button"
              onClick={() => {
                if (item.n === 1 || product) setStep(item.n as WizardStep);
              }}
              className={cx(
                'rounded-2xl border p-4 text-left transition',
                step === item.n ? 'border-blue-500 bg-blue-50 text-blue-700' : item.n < step ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500',
              )}
            >
              <p className="text-xs font-bold">Step {item.n}</p>
              <p className="mt-1 text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs">{item.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      {step === 1 && (
        <Card className="p-6">
          <SectionTitle title="Product Details" />
          <form className="grid gap-4 md:grid-cols-2" onSubmit={createDraft}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Product Name *</span>
              <input className={cx('mt-2 h-12 w-full rounded-xl border px-4 text-sm outline-none transition', errors.name ? 'border-red-400' : 'border-slate-200 focus:border-blue-500')} value={name} onChange={(e) => setName(e.target.value)} placeholder="Air Compressor 250" />
              {errors.name ? <p className="mt-1 text-xs text-red-500">{errors.name}</p> : null}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Category *</span>
              <input className={cx('mt-2 h-12 w-full rounded-xl border px-4 text-sm outline-none transition', errors.category ? 'border-red-400' : 'border-slate-200 focus:border-blue-500')} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Industrial Equipment" />
              {errors.category ? <p className="mt-1 text-xs text-red-500">{errors.category}</p> : null}
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Description *</span>
              <textarea className={cx('mt-2 min-h-28 w-full rounded-xl border p-4 text-sm outline-none transition', errors.description ? 'border-red-400' : 'border-slate-200 focus:border-blue-500')} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the product for customers viewing on mobile..." />
              {errors.description ? <p className="mt-1 text-xs text-red-500">{errors.description}</p> : null}
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Specifications *</span>
              <textarea className={cx('mt-2 min-h-36 w-full rounded-xl border p-4 text-sm font-mono outline-none transition', errors.specs ? 'border-red-400' : 'border-slate-200 focus:border-blue-500')} value={specText} onChange={(e) => setSpecText(e.target.value)} />
              <p className="mt-1 text-xs text-slate-500">One spec per line in the form <code>Label: Value</code></p>
              {errors.specs ? <p className="mt-1 text-xs text-red-500">{errors.specs}</p> : null}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Initial Status</span>
              <select className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500" value={status} onChange={(e) => setStatus(e.target.value as ProductRecord['status'])}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Spatial Hub Visibility</span>
              <select className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500" value={isPublic ? 'public' : 'private'} onChange={(e) => setIsPublic(e.target.value === 'public')}>
                <option value="private">Private Workspace</option>
                <option value="public">Public Spatial Hub</option>
              </select>
            </label>
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              <label className={cx('rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition hover:border-blue-500', errors.thumbnail ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50')}>
                <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={(event) => setThumbnail(event.target.files?.[0] ?? null)} />
                <Image className="mx-auto text-slate-400" size={24} />
                <p className="mt-2 text-sm font-semibold text-slate-700">Thumbnail *</p>
                <p className="text-xs text-slate-500">{thumbnail ? <span className="text-emerald-600">✓ {thumbnail.name}</span> : 'Choose an image'}</p>
                {errors.thumbnail ? <p className="mt-1 text-xs text-red-500">{errors.thumbnail}</p> : null}
              </label>
              <label className={cx('rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition hover:border-blue-500', errors.images ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50')}>
                <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setImages(Array.from(e.target.files ?? []))} />
                <Camera className="mx-auto text-slate-400" size={24} />
                <p className="mt-2 text-sm font-semibold text-slate-700">Product Images *</p>
                <p className="text-xs text-slate-500">{images.length ? <span className="text-emerald-600">✓ {images.length} selected</span> : 'Add gallery images'}</p>
                {errors.images ? <p className="mt-1 text-xs text-red-500">{errors.images}</p> : null}
              </label>
            </div>
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              <label className={cx('rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition hover:border-blue-500', errors.model ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50')}>
                <input type="file" className="sr-only" accept=".glb,.gltf" onChange={(event) => setModel(event.target.files?.[0] ?? null)} />
                <Box className="mx-auto text-slate-400" size={24} />
                <p className="mt-2 text-sm font-semibold text-slate-700">GLB Model *</p>
                <p className="text-xs text-slate-500">{model ? <span className="text-emerald-600">✓ {model.name}</span> : 'Upload the 3D model'}</p>
                {errors.model ? <p className="mt-1 text-xs text-red-500">{errors.model}</p> : null}
              </label>
              <label className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center cursor-pointer transition hover:border-blue-500 block">
                <input type="file" className="sr-only" accept=".usdz" onChange={(event) => setUsdzModel(event.target.files?.[0] ?? null)} />
                <Box className="mx-auto text-slate-400" size={24} />
                <p className="mt-2 text-sm font-semibold text-slate-700">USDZ Model (optional)</p>
                <p className="text-xs text-slate-500">{usdzModel ? <span className="text-emerald-600">✓ {usdzModel.name}</span> : 'For Apple Quick Look'}</p>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center cursor-pointer transition hover:border-blue-500 block">
                <input type="file" className="sr-only" accept="application/pdf" multiple onChange={(e) => setDocuments(Array.from(e.target.files ?? []))} />
                <FileText className="mx-auto text-slate-400" size={24} />
                <p className="mt-2 text-sm font-semibold text-slate-700">Documents (optional)</p>
                <p className="text-xs text-slate-500">{documents.length ? <span className="text-emerald-600">✓ {documents.length} selected</span> : 'Datasheets, manuals, certificates'}</p>
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={creating || !backendHealth?.ok}>
                {creating ? 'Creating...' : 'Create Product & Continue'}
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        </Card>
      )}

      {step === 2 && product ? (
        <div className="space-y-6">
          <Card className="p-6">
            <SectionTitle title="Upload Assets" meta={product.slug ?? product.id} />
            <p className="text-sm text-slate-500 mb-6">
              Click <strong>Upload All Assets</strong> to upload everything in one go, or use individual upload buttons below.
              The QR code generates automatically after the GLB model is uploaded.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <AssetUploader
                title="Thumbnail"
                description="Primary product cover image."
                accept="image/jpeg,image/png,image/webp"
                file={thumbnail}
                onChange={(file) => setThumbnail(file)}
                onUpload={() => thumbnail ? void uploadAsset(thumbnail, 'thumbnail') : null}
                backendReady={backendHealth?.ok === true}
                uploading={uploading.thumbnail}
              />
              <AssetUploader
                title="GLB Model"
                description="Required for QR generation and Android AR. Triggers auto QR."
                accept=".glb,.gltf"
                file={model}
                onChange={(file) => setModel(file)}
                onUpload={async () => {
                  if (!model) return;
                  const refreshed = await uploadAsset(model, 'model');
                  if (refreshed?.qr) setStep(3);
                }}
                backendReady={backendHealth?.ok === true}
                uploading={uploading.model}
              />
              <AssetUploader
                title="USDZ Model"
                description="Required for Apple Quick Look on iOS."
                accept=".usdz"
                file={usdzModel}
                onChange={(file) => setUsdzModel(file)}
                onUpload={async () => {
                  if (!usdzModel) return;
                  const refreshed = await uploadAsset(usdzModel, 'usdz_model');
                  if (refreshed?.qr) setStep(3);
                }}
                backendReady={backendHealth?.ok === true}
                uploading={uploading.usdz_model}
              />
              <MultiAssetUploader
                title="Gallery Images"
                description="Upload one or more product images."
                accept="image/jpeg,image/png,image/webp"
                files={images}
                onChange={setImages}
                onUpload={async () => {
                  for (const file of images) {
                    await uploadAsset(file, 'image');
                  }
                }}
                backendReady={backendHealth?.ok === true}
                uploading={uploading.image}
              />
              <MultiAssetUploader
                title="Documents"
                description="Datasheets, manuals, and spec sheets."
                accept="application/pdf"
                files={documents}
                onChange={setDocuments}
                onUpload={async () => {
                  for (const file of documents) {
                    await uploadAsset(file, 'document');
                  }
                }}
                backendReady={backendHealth?.ok === true}
                uploading={uploading.document}
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ArrowRight size={16} className="rotate-180" />Back
              </Button>
              <Button
                onClick={() => void uploadAllAndFinish()}
                disabled={!backendHealth?.ok || (!thumbnail && !model && images.length === 0)}
              >
                <Sparkles size={16} />
                Upload All Assets & Generate QR
              </Button>
            </div>
          </Card>

          {product.qr ? (
            <Card className="p-6">
              <SectionTitle title="✅ QR Generated" meta="Ready for scanning" />
              <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                <img src={product.qr.png_url} alt="QR" className="w-full rounded-3xl border border-slate-200 bg-white p-3" />
                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Public URL</p>
                    <p className="mt-1 break-all text-sm font-medium">{product.public_url}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a href={product.qr.png_url} download={`${product.slug ?? product.id}.png`}><Button variant="secondary"><Download size={16} />PNG</Button></a>
                    <a href={product.qr.svg_url} download={`${product.slug ?? product.id}.svg`}><Button variant="secondary"><Download size={16} />SVG</Button></a>
                    <Link to={`/product/${product.slug}`}><Button><Globe2 size={16} />Open Product Page</Button></Link>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <SectionTitle title="QR Pending" meta="Will generate after the model upload finishes" />
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <QrCode className="mx-auto text-slate-300" size={40} />
                <p className="mt-4 text-sm text-slate-500">Upload the GLB model to complete the QR workflow.</p>
              </div>
            </Card>
          )}
        </div>
      ) : null}

      {step === 3 && product?.qr ? <ProductQrPanel product={product} /> : null}
      {product?.qr ? <ProductMetricsCard product={product} /> : null}
      {product && product.qr ? (
        <Card className="p-6">
          <SectionTitle title="Workflow Complete 🎉" />
          <div className="flex flex-wrap items-center gap-3">
            <Link to={`/product/${product.slug}`}>
              <Button><Smartphone size={16} />Open mobile page</Button>
            </Link>
            <Button variant="secondary" onClick={() => setStep(3)}><ScanLine size={16} />Review QR</Button>
            <Button variant="secondary" onClick={() => navigate('/products')}><Send size={16} />Go to Products</Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

// ─── Asset Uploader Components ─────────────────────────────────────────────────

function AssetUploader({
  title,
  description,
  accept,
  file,
  onChange,
  onUpload,
  backendReady,
  uploading,
}: {
  title: string;
  description: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  onUpload: () => void;
  backendReady: boolean;
  uploading?: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center transition hover:border-blue-500">
        <input type="file" className="sr-only" accept={accept} onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
        <div>
          <Upload className="mx-auto text-slate-400" size={20} />
          <p className="mt-2 text-sm text-slate-600">{file ? <span className="text-emerald-600">✓ {file.name}</span> : 'Choose a file'}</p>
        </div>
      </label>
      <div className="mt-4 flex items-center gap-3">
        <Button variant="secondary" className="w-full" onClick={onUpload} disabled={!file || !backendReady}>
          {backendReady ? 'Upload' : 'Backend offline'}
        </Button>
      </div>
      {uploading ? <div className="mt-3 h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-blue-600 transition-all duration-200" style={{ width: `${uploading}%` }} /></div> : null}
    </div>
  );
}

function MultiAssetUploader({
  title,
  description,
  accept,
  files,
  onChange,
  onUpload,
  backendReady,
  uploading,
}: {
  title: string;
  description: string;
  accept: string;
  files: File[];
  onChange: (files: File[]) => void;
  onUpload: () => Promise<void>;
  backendReady: boolean;
  uploading?: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center transition hover:border-blue-500">
        <input type="file" className="sr-only" accept={accept} multiple onChange={(event) => onChange(Array.from(event.target.files ?? []))} />
        <div>
          <Upload className="mx-auto text-slate-400" size={20} />
          <p className="mt-2 text-sm text-slate-600">{files.length ? <span className="text-emerald-600">✓ {files.length} selected</span> : 'Choose files'}</p>
        </div>
      </label>
      <div className="mt-4">
        <Button variant="secondary" className="w-full" onClick={() => void onUpload()} disabled={!files.length || !backendReady}>
          {backendReady ? 'Upload all' : 'Backend offline'}
        </Button>
      </div>
      {files.length ? <ul className="mt-3 space-y-1 text-xs text-slate-500">{files.map((file) => <li key={file.name}>• {file.name}</li>)}</ul> : null}
      {uploading ? <div className="mt-3 h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-blue-600 transition-all duration-200" style={{ width: `${uploading}%` }} /></div> : null}
    </div>
  );
}

// ─── Product Experience Page (Admin Preview) ───────────────────────────────────

export function ProductExperiencePage() {
  const token = useAuthStore((s) => s.token);
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const { error: showError, success } = useToast();

  useEffect(() => {
    if (!token || !id) return;
    setLoading(true);
    api.getProduct(token, id)
      .then((row) => setProduct(row))
      .catch((err) => showError('Could not load product', err instanceof ApiClientError ? err.message : 'Unexpected API failure'))
      .finally(() => setLoading(false));
  }, [token, id]);

  const qr = product?.qr;

  async function refreshQr() {
    if (!token || !id) return;
    try {
      const qrRecord = await api.getProductQr(token, id);
      if (qrRecord) {
        setProduct((current) => current ? { ...current, qr: qrRecord, qr_png_url: qrRecord.png_url, qr_svg_url: qrRecord.svg_url } : current);
        success('QR refreshed', 'Product QR is ready.');
      } else {
        showError('QR not ready', 'Upload a GLB model first to generate the QR code.');
      }
    } catch (err) {
      showError('QR unavailable', err instanceof ApiClientError ? err.message : 'Could not fetch QR');
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-400"><RefreshCw className="mr-3 animate-spin" size={24} />Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="space-y-8">
        <PageHeader title="Product Experience" eyebrow="Admin preview for the mobile product journey." />
        <Card className="p-8">
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <Box className="mx-auto text-slate-300" size={42} />
            <h3 className="mt-4 text-lg font-bold text-slate-900">No product selected</h3>
            <p className="mt-2 text-sm text-slate-500">Open the preview from a product row or select a product from the library.</p>
            <Link className="mt-6 inline-flex" to="/products"><Button><ArrowRight size={16} />Go to products</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={product.name}
        eyebrow="Preview the mobile experience, QR readiness, and AR launch behavior."
        action={(
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => void refreshQr()}><QrCode size={18} />Refresh QR</Button>
            <a href={product.public_url ?? '#'} target="_blank" rel="noreferrer"><Button variant="secondary"><ExternalLink size={18} />Open Public Page</Button></a>
          </div>
        )}
      />
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden">
          <div className="h-[540px] bg-slate-100">
            <ThreeProduct modelUrl={safeUrl(product.model_url)} />
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Badge>{product.status}</Badge>
              {qr ? <Badge>QR Ready</Badge> : <Badge>QR Pending</Badge>}
            </div>
            <p className="mt-4 text-sm text-slate-500">{product.category}</p>
            <p className="mt-2 text-base leading-7 text-slate-700">{product.description}</p>
            <div className="mt-6 space-y-3">
              {(product.assets ?? []).filter((asset) => asset.asset_type === 'image' || asset.asset_type === 'thumbnail').slice(0, 3).map((asset) => (
                <div key={asset.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img src={asset.public_url} alt={asset.original_name} className="h-28 w-full object-cover" />
                </div>
              ))}
            </div>
          </Card>
          <ProductMetricsCard product={product} />
          {qr ? <ProductQrPanel product={product} /> : null}
        </div>
      </div>
      {product.specs && Object.keys(product.specs).length > 0 ? (
        <Card className="p-6">
          <SectionTitle title="Specifications" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(product.specs).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{key}</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export { PublicProductPage } from './PublicProductPage';
