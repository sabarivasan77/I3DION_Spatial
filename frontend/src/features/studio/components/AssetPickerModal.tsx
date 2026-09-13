import React, { useEffect, useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { X, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';

interface AssetItem {
  id: string;
  name: string;
  url: string;
  category: string;
}

const FALLBACK_ASSETS: AssetItem[] = [
  {
    id: 'asset_01',
    name: 'Spatial 3D Machine Model',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop',
    category: 'Product Image',
  },
  {
    id: 'asset_02',
    name: 'Industrial Equipment Render',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop',
    category: 'Product Image',
  },
  {
    id: 'asset_03',
    name: 'Futuristic Studio Workspace',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    category: 'Banner',
  },
  {
    id: 'asset_04',
    name: 'AR Floor Model Preview',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=800&auto=format&fit=crop',
    category: 'AR Asset',
  },
];

export const AssetPickerModal: React.FC = () => {
  const {
    isAssetPickerOpen,
    assetPickerTargetNodeId,
    closeAssetPicker,
    updateWidgetProperties,
  } = useStudioStore();

  const [assets, setAssets] = useState<AssetItem[]>(FALLBACK_ASSETS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAssetPickerOpen) {
      loadI3DIONAssets();
    }
  }, [isAssetPickerOpen]);

  const loadI3DIONAssets = async () => {
    setLoading(true);
    try {
      const products = await (api as any).getProducts?.() || [];
      if (Array.isArray(products) && products.length > 0) {
        const productAssets: AssetItem[] = products
          .filter((p) => p.image_url)
          .map((p) => ({
            id: p.id,
            name: p.name,
            url: p.image_url!,
            category: p.category || 'Product Asset',
          }));

        if (productAssets.length > 0) {
          setAssets([...productAssets, ...FALLBACK_ASSETS]);
        }
      }
    } catch (e) {
      console.warn('Using fallback asset library:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isAssetPickerOpen || !assetPickerTargetNodeId) return null;

  const handleSelectAsset = (url: string) => {
    updateWidgetProperties(assetPickerTargetNodeId, { src: url });
    closeAssetPicker();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                I3DION Asset Library
              </h3>
              <p className="text-xs text-slate-500">
                Select an asset uploaded in Product Management
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAssetPicker}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Grid */}
        <div className="no-scrollbar flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-slate-400">
              <Loader2 size={24} className="animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => handleSelectAsset(asset.url)}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-600/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600 shadow-md">
                        <Check size={18} />
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h4 className="truncate text-xs font-bold text-slate-800">
                      {asset.name}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400">
                      {asset.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 px-6 py-3 bg-slate-50">
          <button
            type="button"
            onClick={closeAssetPicker}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
