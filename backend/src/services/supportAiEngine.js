import { query } from '../db/pool.js';

export const supportAiEngine = {
  
  /**
   * Mock of an LLM call processing a user's chat message.
   * In a real implementation, this would build a prompt with the chat history
   * and current page context, then call OpenAI/Claude.
   */
  async processChatMessage(companyId, sessionId, userMessage, contextData) {
    const messageLower = userMessage.toLowerCase();
    let intent = 'General Question';
    let priority = 'Low';
    let sentiment = 'Neutral';

    // 1. Classification & Sentiment Heuristics
    if (messageLower.includes('broken') || messageLower.includes('not working') || messageLower.includes('error') || messageLower.includes('fail')) {
      intent = 'Technical Issue';
      priority = 'High';
      sentiment = 'Frustrated';
    } else if (messageLower.includes('login') || messageLower.includes('password') || messageLower.includes('access denied')) {
      intent = 'Account Issue';
      priority = 'Critical';
      sentiment = 'Urgent';
    } else if (messageLower.includes('buy') || messageLower.includes('price') || messageLower.includes('cost')) {
      intent = 'Sales Inquiry';
      priority = 'Medium';
      sentiment = 'Happy';
    } else if (messageLower.includes('how do i') || messageLower.includes('setup') || messageLower.includes('guide')) {
      intent = 'Product Question';
      priority = 'Low';
    }

    // 2. Escalation Trigger Detection
    const needsEscalation = messageLower.includes('human') || messageLower.includes('support') || messageLower.includes('agent') || messageLower.includes('talk to someone');

    // 3. RAG Retrieval Mock (Search knowledge base)
    const { rows: kbArticles } = await query(
      `SELECT title, content FROM knowledge_base 
       WHERE company_id = $1 
         AND (title ILIKE $2 OR content ILIKE $2)
       LIMIT 1`,
      [companyId, `%${userMessage.split(' ')[0]}%`] // Very naive keyword match
    );

    let reply = "";
    
    if (needsEscalation) {
      reply = "I understand you'd like to speak with a human support agent. I am escalating this conversation now and creating a support ticket for you. An agent will review our chat and get back to you shortly.";
    } else if (kbArticles.length > 0) {
      reply = `Based on our documentation for "${kbArticles[0].title}":\n\n${kbArticles[0].content}\n\nDid this resolve your issue?`;
    } else {
      // Context aware fallback
      if (contextData?.currentPage === '/products/upload') {
        reply = "It looks like you are on the Product Upload page. To upload a product, you can drag and drop your GLB or USDZ file into the designated area. Do you need help with file formats?";
      } else if (contextData?.currentPage?.includes('/ar/')) {
        reply = "I see you are in the AR Viewer. To place a model, make sure your camera is pointed at a well-lit, textured surface, and tap the screen when the placement indicator appears.";
      } else {
        reply = "I'm a self-learning AI assistant. I didn't find an exact match in the knowledge base for your query. Could you rephrase your question, or ask to speak with a human agent?";
      }
    }

    return {
      reply,
      intent,
      priority,
      sentiment,
      needsEscalation
    };
  },

  /**
   * Generates a suggested reply for human support agents based on ticket context.
   */
  async generateSmartSuggestion(ticketId) {
    const { rows } = await query(`SELECT subject, message, category FROM support_tickets WHERE id = $1`, [ticketId]);
    if (!rows.length) return null;

    const ticket = rows[0];
    const subjectLower = ticket.subject.toLowerCase();

    // Mock generative logic
    if (subjectLower.includes('password') || subjectLower.includes('login')) {
      return "Hi there, I understand you're having trouble logging in. Have you tried using the 'Forgot Password' link on the login screen? Let me know if you need me to trigger a manual reset link for you.";
    }
    
    if (ticket.category === 'Technical Issue') {
      return "Hello, I am reviewing the technical error you reported. Could you please provide the exact browser version and device you are using so we can reproduce the issue on our end?";
    }

    return `Hi, thanks for reaching out regarding "${ticket.subject}". We are currently looking into this and will provide an update shortly.`;
  }
};
