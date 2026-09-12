import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, MessageSquare, Share2, Download, Box, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { hubApi, HubProduct, HubComment } from '../../services/hubApi';
import { Button, Card } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/Toast';

export function HubProductDetail() {
  const { id } = useParams();
  const { info, success } = useToast();
  const [product, setProduct] = useState<HubProduct | null>(null);
  const [comments, setComments] = useState<HubComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const token = useAuthStore(s => s.token);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      success('Link Copied', 'Product link copied to clipboard.');
    } else {
      info('Share Product', 'Copy the page URL to share this spatial product.');
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      hubApi.getProduct(id),
      hubApi.getComments('product', id)
    ]).then(([prodData, commentsData]) => {
      setProduct(prodData);
      setComments(commentsData);
      if (prodData.slug) {
        import('../../services/Tracker').then(({ Tracker }) => {
          Tracker.trackEvent('product_view', { slug: prodData.slug }).catch(() => null);
        });
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!token || !id) return;
    const res = await hubApi.toggleLike(token, 'product', id);
    setLiked(res.liked);
    setProduct(p => p ? { ...p, likes_count: p.likes_count + (res.liked ? 1 : -1) } : p);
  };

  const handleDownload = () => {
    if (!product || !product.modelUrl) return;
    const a = document.createElement('a');
    a.href = product.modelUrl;
    a.download = `${product.slug ?? product.id}.glb`;
    a.click();
    if (product.slug) {
      import('../../services/Tracker').then(({ Tracker }) => {
        Tracker.trackEvent('download', { slug: product.slug }).catch(() => null);
      });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id || !commentText.trim()) return;
    const newComment = await hubApi.postComment(token, 'product', id, commentText);
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  const viewerRef = useRef<any>(null);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const handleArStatus = (e: any) => {
      if (e.detail.status === 'session-started' && product?.slug) {
        import('../../services/Tracker').then(({ Tracker }) => {
          Tracker.trackEvent('ar_launch', { slug: product.slug }).catch(() => null);
        });
      }
    };
    viewer.addEventListener('ar-status', handleArStatus);
    return () => viewer.removeEventListener('ar-status', handleArStatus);
  }, [product?.slug]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!product) return <div className="p-8 text-center text-rose-500">Product not found</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <Link to="/hub" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hub
        </Link>
        
        {/* Main Viewer Area */}
        <div className="bg-slate-100 rounded-2xl aspect-video md:aspect-[16/10] overflow-hidden relative shadow-inner flex items-center justify-center">
          {product.modelUrl ? (
            <model-viewer
              ref={viewerRef}
              src={product.modelUrl}
              alt={product.name}
              ar
              auto-rotate
              camera-controls
              style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9' }}
            >
              <button slot="ar-button" className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-blue-600 px-4 py-2 rounded-lg font-bold shadow-sm hover:scale-105 transition-transform flex items-center">
                <Box className="w-4 h-4 mr-2" /> View in AR
              </button>
            </model-viewer>
          ) : product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
          ) : (
            <Box className="w-24 h-24 text-slate-300" />
          )}
        </div>

        {/* Content Details */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{product.name}</h1>
          <p className="text-lg text-slate-600 mb-6">{product.description}</p>
          <div className="flex flex-wrap gap-2">
            {product.tags?.map(t => (
               <span key={t} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">#{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar: Social & Creator */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        {/* Action Bar */}
        <Card className="p-4 flex justify-around">
          <button onClick={handleLike} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${liked ? 'text-rose-500' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Heart className={`w-6 h-6 mb-1 ${liked ? 'fill-current' : ''}`} />
            <span className="text-xs font-bold">{product.likes_count}</span>
          </button>
          <button onClick={() => {
            const el = document.getElementById('comments-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }} className="flex flex-col items-center p-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
            <MessageSquare className="w-6 h-6 mb-1" />
            <span className="text-xs font-bold">{comments.length}</span>
          </button>
          <button onClick={handleShare} className="flex flex-col items-center p-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
            <Share2 className="w-6 h-6 mb-1" />
            <span className="text-xs font-bold">Share</span>
          </button>
          {product.downloads_count !== undefined && (
            <button onClick={handleDownload} className="flex flex-col items-center p-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
              <Download className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">{product.downloads_count}</span>
            </button>
          )}
        </Card>

        {/* Creator Profile snippet */}
        <Card className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Published By</h3>
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl overflow-hidden">
                {product.creator_avatar ? <img src={product.creator_avatar} alt="" className="w-full h-full object-cover" /> : product.creator_name?.charAt(0) || product.company_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900">{product.creator_name || product.company_name}</h4>
                <p className="text-sm text-slate-500">{product.company_name}</p>
              </div>
              <Button onClick={() => info('Follow Creator', `You are following updates from ${product.company_name || 'this creator'}.`)} variant="secondary" className="text-xs px-2 py-1 h-auto">Follow</Button>
          </div>
        </Card>

        {/* Comments Section */}
        <Card className="p-6 flex-1 flex flex-col">
          <h3 className="font-bold text-slate-900 mb-4">Comments ({comments.length})</h3>
          
          <form onSubmit={handleComment} className="mb-6 flex gap-2">
            <input 
              type="text" 
              placeholder={token ? "Add a comment..." : "Log in to comment"} 
              disabled={!token}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <Button type="submit" disabled={!token || !commentText.trim()}>Post</Button>
          </form>

          <div className="space-y-4 overflow-y-auto max-h-96">
            {comments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No comments yet. Be the first!</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">
                    {c.user_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="bg-slate-50 rounded-xl p-3 inline-block">
                      <p className="text-xs font-bold text-slate-900 mb-1">{c.user_name}</p>
                      <p className="text-sm text-slate-700">{c.content}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 ml-2">
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
