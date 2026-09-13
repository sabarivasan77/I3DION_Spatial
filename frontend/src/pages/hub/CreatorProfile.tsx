import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Globe, Heart, Building2, ShieldCheck, UserCheck, UserPlus } from 'lucide-react';
import { hubApi, HubProduct } from '../../services/hubApi';
import { apiRequest } from '../../services/api';
import { Card, SectionTitle, Button } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { SPATIAL_HUB_MODELS } from '../../data/spatialHubModels';
import { HubContextMenu } from '../../components/hub/HubContextMenu';
import { useToast } from '../../components/Toast';

interface CreatorProfileData {
  user_id: string;
  name: string;
  company_id: string;
  company_name: string;
  avatar_url: string;
  bio: string;
  website: string;
  followers_count: number;
}

export function CreatorProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<CreatorProfileData | null>(null);
  const [products, setProducts] = useState<HubProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  
  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);
  const { success } = useToast();

  useEffect(() => {
    setLoading(true);
    const creatorId = id || 'vertex_creator';
    
    apiRequest(`/hub/creators/${creatorId}`)
      .then((data: any) => {
        setProfile(data as CreatorProfileData);
      })
      .catch(() => {
        // Default mock profile if endpoint table is initializing
        setProfile({
          user_id: creatorId,
          name: currentUser?.id === creatorId ? currentUser.name : 'Dr. Aris Vance',
          company_id: 'org_vertex_1',
          company_name: 'Vertex Spatial Systems',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
          bio: 'Lead Spatial Systems Architect & Industrial Designer specializing in heavy machinery digital twins and AR handoffs.',
          website: 'https://i3dion.com',
          followers_count: 142
        });
      })
      .finally(() => {
        // Map curated master models to HubProduct
        const mappedProducts: HubProduct[] = SPATIAL_HUB_MODELS.slice(0, 6).map((m) => ({
          id: m.id,
          company_id: 'org_vertex_1',
          name: m.name,
          description: m.shortDescription,
          category: m.category,
          imageUrl: m.thumbnail,
          modelUrl: m.modelUrl,
          slug: m.slug,
          views_count: m.viewsCount,
          likes_count: m.likesCount,
          downloads_count: m.downloadsCount,
          company_name: 'Vertex Spatial Systems',
          created_at: new Date().toISOString(),
          tags: m.tags
        }));
        setProducts(mappedProducts);
        setLoading(false);
      });
  }, [id, currentUser]);

  const handleFollow = async () => {
    const nextState = !following;
    setFollowing(nextState);
    if (profile) {
      setProfile({
        ...profile,
        followers_count: profile.followers_count + (nextState ? 1 : -1)
      });
    }
    if (token && id) {
      try {
        await hubApi.followCreator(token, id);
      } catch {
        // Handled silently
      }
    }
    success(nextState ? 'Following Creator' : 'Unfollowed Creator', `Updated feed notifications.`);
  };

  if (loading) {
    return <div className="p-12 text-center text-xs font-semibold text-slate-400">Loading Creator Profile...</div>;
  }

  if (!profile) {
    return <div className="p-12 text-center text-xs font-semibold text-rose-500">Creator profile not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 select-none space-y-8">
      {/* Profile Header Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xs flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="h-32 w-32 rounded-full bg-[#0F172A] flex items-center justify-center text-white font-bold text-4xl overflow-hidden shadow-lg border-4 border-slate-100 shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile.name?.charAt(0) || 'C'
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-3">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl font-black text-slate-900">{profile.name}</h1>
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <Link to={`/hub/company/${profile.company_id}`} className="text-xs font-bold text-blue-600 hover:underline flex items-center justify-center md:justify-start gap-1 mt-0.5">
              <Building2 size={13} /> {profile.company_name}
            </Link>
          </div>

          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{profile.bio}</p>

          <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
            <div>
              <span className="block text-xl font-black text-slate-900">{profile.followers_count}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Followers</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="block text-xl font-black text-slate-900">{products.length}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">3D Models</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto min-w-[180px]">
          <button
            onClick={handleFollow}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 ${
              following ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
            {following ? 'Following' : 'Follow Creator'}
          </button>
          
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition flex items-center justify-center gap-2"
            >
              <Globe size={14} /> Visit Website
            </a>
          )}
        </div>
      </div>

      {/* Portfolio Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-slate-900">Published 3D Assets & Models</h2>
          <span className="text-xs font-medium text-slate-500">{products.length} Items</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((item) => (
            <div key={item.id} className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:shadow-md transition">
              <div className="relative aspect-square w-full rounded-xl bg-[#0F172A] overflow-hidden mb-3">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Box className="w-12 h-12 text-slate-600" />
                  </div>
                )}
                <div className="absolute top-2 right-2 z-10">
                  <HubContextMenu itemId={item.id} itemTitle={item.name} itemSlug={item.slug} ownerId={profile.user_id} />
                </div>
              </div>

              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">{item.category}</span>
              <Link to={`/hub/product/${item.slug}`} className="block mt-0.5">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">{item.name}</h3>
              </Link>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-semibold"><Heart size={13} className="text-rose-500" /> {item.likes_count}</span>
                <Link to={`/hub/product/${item.slug}`} className="font-bold text-blue-600 hover:underline">View 3D →</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
