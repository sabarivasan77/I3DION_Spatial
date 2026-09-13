export class RankingService {
  /**
   * Pluggable ranking function for scoring candidates against user behavioral context.
   */
  rankItems(candidates, userProfile = {}, options = {}) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return [];
    }

    const {
      categoryWeight = 0.35,
      freshnessWeight = 0.25,
      popularityWeight = 0.25,
      interactionWeight = 0.15,
    } = options;

    const topCategoryMap = new Map((userProfile.topCategories || []).map((c) => [c.category, c.weight]));
    const topProductIdSet = new Set(userProfile.topProductIds || []);

    const ranked = candidates.map((item) => {
      // 1. Category Affinity Score (0 - 1)
      const userCategoryWeight = topCategoryMap.get(item.category) || 0;
      const categoryScore = Math.min(1.0, userCategoryWeight / 10.0);

      // 2. Freshness Score (0 - 1)
      const createdDate = new Date(item.created_at || Date.now());
      const daysOld = Math.max(0, (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const freshnessScore = Math.max(0.1, Math.exp(-daysOld / 30)); // 30-day exponential decay

      // 3. Popularity Score (0 - 1)
      const views = item.views_count || 0;
      const likes = item.likes_count || 0;
      const popularityScore = Math.min(1.0, (views * 0.05 + likes * 0.5) / 50.0);

      // 4. Direct Interaction Score
      const interactionScore = topProductIdSet.has(item.id) ? 1.0 : 0.0;

      // Final weighted ranking score
      const totalScore =
        categoryScore * categoryWeight +
        freshnessScore * freshnessWeight +
        popularityScore * popularityWeight +
        interactionScore * interactionWeight;

      return {
        ...item,
        _rankingScore: Math.round(totalScore * 1000) / 1000,
        _matchReasons: this.generateMatchReasons(item, categoryScore, interactionScore, freshnessScore),
      };
    });

    // Sort by ranking score descending
    return ranked.sort((a, b) => b._rankingScore - a._rankingScore);
  }

  generateMatchReasons(item, categoryScore, interactionScore, freshnessScore) {
    const reasons = [];
    if (interactionScore > 0) {
      reasons.push('Previously engaged with this asset');
    }
    if (categoryScore > 0.3) {
      reasons.push(`Matches your interest in ${item.category}`);
    }
    if (freshnessScore > 0.8) {
      reasons.push('Recently published asset');
    }
    if (reasons.length === 0) {
      reasons.push('Popular in Spatial Ecosystem');
    }
    return reasons;
  }
}

export const rankingService = new RankingService();
