import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Download, Share2, Box as BoxIcon, ExternalLink } from 'lucide-react';
import { hubApi, HubProduct } from '../../services/hubApi';
import { Card, SectionTitle, Button } from '../../components/ui';

export function HubFeed() {
  const [feed, setFeed] = useState<HubProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hubApi.getFeed().then(data => {
      setFeed(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Hub...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <SectionTitle title="Spatial Hub" />
      <p className="text-slate-500 mb-8">Discover top industrial models, AR experiences, and catalogs from the community.</p>

      {/* Featured Section */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
          <Heart className="w-5 h-5 text-rose-500 mr-2" /> Featured Demo Models
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'demo-machine', name: 'Industrial Machine', icon: '🏭', color: 'bg-blue-100 text-blue-600' },
            { id: 'demo-car', name: 'Electric Car', icon: '🏎️', color: 'bg-emerald-100 text-emerald-600' },
            { id: 'demo-motor', name: 'Electric Motor', icon: '⚡', color: 'bg-amber-100 text-amber-600' },
            { id: 'demo-pump', name: 'Centrifugal Pump', icon: '💧', color: 'bg-cyan-100 text-cyan-600' },
          ].map(demo => (
            <Link key={demo.id} to={`/hub/product/${demo.id}`} className="group block">
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-slate-200 h-full flex flex-col items-center justify-center">
                <div className={`w-16 h-16 ${demo.color} rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                  {demo.icon}
                </div>
                <h3 className="font-bold text-slate-900">{demo.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Free Demo Model</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-4">Community Feed</h2>

      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {feed.map(item => (
          <Card key={item.id} className="break-inside-avoid overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200">
            {/* Header */}
            <div className="p-4 flex items-center space-x-3 border-b border-slate-100">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                {item.creator_avatar ? <img src={item.creator_avatar} alt="" className="w-full h-full object-cover" /> : item.creator_name?.charAt(0) || item.company_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{item.creator_name || item.company_name}</p>
                <p className="text-xs text-slate-500 truncate">{item.company_name}</p>
              </div>
            </div>

            {/* Media */}
            <Link to={`/hub/product/${item.id}`} className="block relative group bg-slate-100 aspect-square flex items-center justify-center overflow-hidden">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <BoxIcon className="w-16 h-16 text-slate-300" />
              )}
              {item.modelUrl && (
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded shadow-sm text-blue-600 flex items-center">
                  <BoxIcon className="w-3 h-3 mr-1" /> AR Ready
                </div>
              )}
            </Link>

            {/* Content */}
            <div className="p-4">
              <Link to={`/hub/product/${item.id}`} className="hover:text-blue-600">
                <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">{item.name}</h3>
              </Link>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{item.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {item.tags?.slice(0,3).map(tag => (
                  <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">#{tag}</span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex space-x-4 text-slate-500">
                  <button className="flex items-center hover:text-rose-500 transition-colors">
                    <Heart className="w-4 h-4 mr-1.5" />
                    <span className="text-xs font-medium">{item.likes_count}</span>
                  </button>
                  <div className="flex items-center" title="Views">
                    <span className="text-xs font-medium mr-1.5 text-slate-400">👀</span>
                    <span className="text-xs font-medium">{item.views_count || 0}</span>
                  </div>
                  <div className="flex items-center" title="Downloads">
                    <Download className="w-4 h-4 mr-1.5 text-slate-400" />
                    <span className="text-xs font-medium">{item.downloads_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
