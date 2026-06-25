/**
 * I3DION Spatial — Rule-Based Recommendation Engine
 * Architecture is ML-ready: all signals are stored and computed here.
 * Future: replace scoring functions with ML model predictions.
 */

export interface RecommendationProduct {
  id: string;
  name: string;
  category: string;
  image?: string;
  status?: string;
  score: number;
  reason: string;
}

export interface RecommendationResult {
  related: RecommendationProduct[];
  recentlyViewed: RecommendationProduct[];
  frequentlyViewedTogether: RecommendationProduct[];
}

// ─── Recently Viewed History ─────────────────────────────────────────────────

const RECENTLY_VIEWED_KEY = 'i3dion.recently_viewed';
const MAX_HISTORY = 20;

export function recordProductView(productId: string, productName: string, category: string, imageUrl?: string) {
  try {
    const history = getRecentlyViewedRaw();
    const filtered = history.filter((h) => h.id !== productId);
    filtered.unshift({ id: productId, name: productName, category, imageUrl, viewedAt: Date.now() });
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
  } catch { /* ignore */ }
}

function getRecentlyViewedRaw(): Array<{
  id: string; name: string; category: string; imageUrl?: string; viewedAt: number;
}> {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function getRecentlyViewed(excludeId?: string): RecommendationProduct[] {
  return getRecentlyViewedRaw()
    .filter((h) => h.id !== excludeId)
    .slice(0, 6)
    .map((h) => ({
      id: h.id,
      name: h.name,
      category: h.category,
      image: h.imageUrl,
      score: 1,
      reason: `Viewed ${timeAgo(h.viewedAt)}`,
    }));
}

// ─── Related Products (category + tag overlap) ───────────────────────────────

export function getRelatedProducts(
  currentProduct: { id: string; category: string; tags?: string[] },
  allProducts: Array<{ id: string; name: string; category: string; image?: string; status?: string; tags?: string[] }>,
): RecommendationProduct[] {
  return allProducts
    .filter((p) => p.id !== currentProduct.id && p.status === 'Published')
    .map((p) => {
      let score = 0;
      let reason = '';

      // Same category: strong signal
      if (p.category === currentProduct.category) {
        score += 60;
        reason = `Same category: ${p.category}`;
      }

      // Tag overlap
      const currentTags = currentProduct.tags ?? [];
      const productTags = p.tags ?? [];
      const sharedTags = currentTags.filter((t) => productTags.includes(t));
      if (sharedTags.length > 0) {
        score += sharedTags.length * 15;
        reason = reason || `Shares tags: ${sharedTags.slice(0, 2).join(', ')}`;
      }

      return { id: p.id, name: p.name, category: p.category, image: p.image, status: p.status, score, reason: reason || 'Similar product' };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ─── Frequently Viewed Together (co-occurrence from analytics events) ─────────

const CO_OCCURRENCE_KEY = 'i3dion.co_occurrence';

export function recordCoView(productId: string, sessionId: string) {
  try {
    const store: Record<string, string[]> = JSON.parse(localStorage.getItem(CO_OCCURRENCE_KEY) ?? '{}');
    if (!store[sessionId]) store[sessionId] = [];
    if (!store[sessionId].includes(productId)) {
      store[sessionId].push(productId);
    }
    // Keep only last 100 sessions
    const keys = Object.keys(store);
    if (keys.length > 100) {
      delete store[keys[0]];
    }
    localStorage.setItem(CO_OCCURRENCE_KEY, JSON.stringify(store));
  } catch { /* ignore */ }
}

export function getFrequentlyViewedTogether(
  productId: string,
  allProducts: Array<{ id: string; name: string; category: string; image?: string; status?: string }>,
): RecommendationProduct[] {
  try {
    const store: Record<string, string[]> = JSON.parse(localStorage.getItem(CO_OCCURRENCE_KEY) ?? '{}');
    const coMap: Record<string, number> = {};

    for (const session of Object.values(store)) {
      if (session.includes(productId)) {
        for (const id of session) {
          if (id !== productId) {
            coMap[id] = (coMap[id] ?? 0) + 1;
          }
        }
      }
    }

    return allProducts
      .filter((p) => p.id !== productId && coMap[p.id] && p.status === 'Published')
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        image: p.image,
        score: coMap[p.id] ?? 0,
        reason: `Viewed together ${coMap[p.id]}x`,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  } catch {
    return [];
  }
}

// ─── Recommended Catalogs ────────────────────────────────────────────────────

export function getRecommendedCatalogs(
  currentCategory: string,
  catalogs: Array<{ id: string; name: string; description?: string; status?: string; productCategories?: string[] }>,
): Array<{ id: string; name: string; reason: string }> {
  return catalogs
    .filter((c) => c.status === 'Published')
    .map((c) => ({
      id: c.id,
      name: c.name,
      reason: (c.productCategories ?? []).includes(currentCategory)
        ? `Includes ${currentCategory} products`
        : 'Recommended catalog',
    }))
    .slice(0, 3);
}

// ─── ML-Ready Feature Vector ──────────────────────────────────────────────────

/**
 * Returns a feature vector for the current user/session.
 * Future: send this to an ML endpoint for personalized recommendations.
 */
export function getUserFeatureVector() {
  const recentlyViewed = getRecentlyViewedRaw();
  const categories = recentlyViewed.map((h) => h.category);
  const categoryFreq: Record<string, number> = {};
  for (const cat of categories) {
    categoryFreq[cat] = (categoryFreq[cat] ?? 0) + 1;
  }
  return {
    recentProductCount: recentlyViewed.length,
    topCategories: Object.entries(categoryFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c),
    sessionCount: Object.keys(JSON.parse(localStorage.getItem(CO_OCCURRENCE_KEY) ?? '{}')).length,
    lastActiveAt: recentlyViewed[0]?.viewedAt ?? null,
  };
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
