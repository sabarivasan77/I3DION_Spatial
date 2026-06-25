import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Globe, Heart } from 'lucide-react';
import { hubApi, HubProduct } from '../../services/hubApi';
import { apiRequest } from '../../services/api';
import { Card, SectionTitle, Button } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

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
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    // Using apiRequest directly since it's a specific route just for profile
    Promise.all([
      apiRequest(`/hub/creators/${id}`),
      hubApi.search('', '') // In a real app we would filter by creator id, but we will mock or filter locally for now
    ]).then(([profileData, allProducts]) => {
      const pData = profileData as CreatorProfileData;
      setProfile(pData);
      setProducts(allProducts.filter(p => p.company_id === pData.company_id || p.id === id));
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    if (!token || !id) return;
    const res = await hubApi.followCreator(token, id);
    setFollowing(res.following);
    setProfile(p => p ? { ...p, followers_count: p.followers_count + (res.following ? 1 : -1) } : p);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Profile...</div>;
  if (!profile) return <div className="p-8 text-center text-rose-500">Creator not found</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Profile Header */}
      <Card className="p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8 bg-gradient-to-br from-slate-50 to-white">
        <div className="h-32 w-32 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-5xl overflow-hidden shadow-lg border-4 border-white">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : profile.name?.charAt(0) || profile.company_name?.charAt(0)}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{profile.name || profile.company_name}</h1>
          <p className="text-lg text-slate-600 mb-4">{profile.company_name}</p>
          <p className="text-sm text-slate-500 max-w-2xl mb-6">{profile.bio || 'Industrial Designer & Spatial Engineer'}</p>
          
          <div className="flex items-center justify-center md:justify-start gap-6">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-2xl font-bold text-slate-900">{profile.followers_count}</span>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Followers</span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="text-2xl font-bold text-slate-900">{products.length}</span>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Models Published</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[200px]">
          <Button onClick={handleFollow} variant={following ? "secondary" : "primary"} className="w-full">
            {following ? 'Following' : 'Follow Creator'}
          </Button>
          {profile.website && (
             <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
               <Globe className="w-4 h-4" /> Visit Website
             </Button>
          )}
        </div>
      </Card>

      <SectionTitle title="Public Portfolio" />
      
      {/* Product Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 mt-8">
        {products.map(item => (
          <Card key={item.id} className="break-inside-avoid overflow-hidden hover:shadow-lg transition-all duration-300">
             <Link to={`/hub/product/${item.id}`} className="block relative group bg-slate-100 aspect-square flex items-center justify-center overflow-hidden">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <Box className="w-16 h-16 text-slate-300" />
              )}
            </Link>
            <div className="p-4">
              <Link to={`/hub/product/${item.id}`} className="hover:text-blue-600">
                <h3 className="font-bold text-slate-900 mb-1">{item.name}</h3>
              </Link>
              <div className="flex space-x-4 text-slate-500 mt-3">
                <div className="flex items-center text-xs font-medium"><Heart className="w-3 h-3 mr-1" /> {item.likes_count}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
