export class RecencyDecayEngine {
  /**
   * Calculates exponential decay multiplier based on half-life formula:
   * Multiplier = 0.5 ^ (daysAgo / halfLifeDays)
   */
  calculateDecayMultiplier(eventTimestamp, halfLifeDays = 14) {
    if (!eventTimestamp) return 0.1;

    const eventDate = new Date(eventTimestamp);
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - eventDate.getTime());
    const daysAgo = diffMs / (1000 * 60 * 60 * 24);

    // Exponential decay with configurable half-life
    const multiplier = Math.pow(0.5, daysAgo / halfLifeDays);

    // Cap floor at 0.02 (2% minimal baseline weight for old history)
    return Math.max(0.02, Math.min(1.0, multiplier));
  }

  /**
   * Applies recency decay to a list of weighted events.
   */
  decayWeightedEvents(eventsWithWeights, halfLifeDays = 14) {
    let totalDecayedScore = 0;

    for (const item of eventsWithWeights) {
      const baseWeight = item.weight || 1;
      const decay = this.calculateDecayMultiplier(item.created_at || item.timestamp, halfLifeDays);
      totalDecayedScore += baseWeight * decay;
    }

    return Math.round(totalDecayedScore * 100) / 100;
  }
}

export const recencyDecayEngine = new RecencyDecayEngine();
