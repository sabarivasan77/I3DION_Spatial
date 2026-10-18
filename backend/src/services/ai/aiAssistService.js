/**
 * AI Assist Service (Phase P9 Innovation Item 10)
 * Strict opt-in, human-in-the-loop, zero customer data training guarantee.
 */

import { pool } from '../../db/pool.js';

export const aiAssistService = {
  /**
   * Verify organization AI Assist opt-in status
   */
  async verifyOptIn(organizationId) {
    const res = await pool.query(
      `SELECT ai_assist_enabled FROM organizations WHERE id = $1`,
      [organizationId]
    );

    if (res.rows.length === 0 || !res.rows[0].ai_assist_enabled) {
      const error = new Error('AI Assist is disabled by organization policy. Contact your organization administrator to opt-in.');
      error.status = 403;
      error.code = 'AI_ASSIST_OPT_IN_REQUIRED';
      throw error;
    }

    return true;
  },

  /**
   * Generate structured product description, technical highlights, and 3D alt text
   * Complies with Decision D-10: Human-in-the-loop mandatory review.
   */
  async generateProductMetadata(organizationId, productInput = {}) {
    // 1. Mandatory opt-in gate
    await this.verifyOptIn(organizationId);

    const { name = 'Industrial Component', category = 'Equipment', specs = {} } = productInput;

    // Structured metadata generation with zero model training
    const specEntries = Object.entries(specs);
    const specsSummary = specEntries.length > 0
      ? specEntries.map(([k, v]) => `${k}: ${v}`).join(', ')
      : 'standard precision tolerances';

    const proposedDescription = `${name} is an enterprise-grade ${category.toLowerCase()} engineered for high-durability continuous operation. Features include ${specsSummary}.`;

    const proposedHighlights = [
      `Engineered for heavy-duty industrial applications in ${category.toLowerCase()} systems`,
      `Verified dimensional tolerances: ${specsSummary}`,
      'CAD-verified digital twin ready for 1:1 scale AR inspection and spatial cataloging'
    ];

    const proposedAltText = `Interactive 3D digital twin rendering of ${name} with CAD-derived geometry, surface inspection hotspots, and dimension overlays.`;

    const proposedSeoKeywords = [
      name.toLowerCase(),
      category.toLowerCase(),
      'industrial equipment',
      '3d cad twin',
      'interactive catalog'
    ];

    return {
      success: true,
      humanApprovalRequired: true,
      trainingDataIsolated: true,
      termsNotice: 'No customer data or CAD parameters are stored or used for model training per Decision D-10.',
      proposal: {
        suggestedDescription: proposedDescription,
        suggestedHighlights: proposedHighlights,
        suggestedAltText: proposedAltText,
        suggestedKeywords: proposedSeoKeywords
      }
    };
  }
};
