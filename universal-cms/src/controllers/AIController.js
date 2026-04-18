import { asyncHandler } from '../middleware/error.middleware.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';
import AIService from '../services/AIService.js';

class AIController {
  /**
   * Generate content using AI
   */
  static async generateContent(req, res) {
    const { prompt, type, options = {} } = req.body;

    const result = await AIService.generateContent({
      prompt,
      type,
      tenantId: req.tenant.id,
      userId: req.user.userId,
      options,
    });

    // Track usage
    await AIService.trackUsage(req.tenant.id, req.user.userId, result.tokensUsed);

    ApiResponse.success(res, 200, 'Content generated', {
      content: result.content,
      tokensUsed: result.tokensUsed,
      model: result.model,
    });
  }

  /**
   * Generate complete page structure
   */
  static async generatePage(req, res) {
    const { prompt, style, sections } = req.body;

    const result = await AIService.generatePage({
      prompt,
      style,
      sections,
      tenantId: req.tenant.id,
      userId: req.user.userId,
    });

    await AIService.trackUsage(req.tenant.id, req.user.userId, result.tokensUsed);

    ApiResponse.success(res, 200, 'Page generated', {
      page: result.page,
      tokensUsed: result.tokensUsed,
    });
  }

  /**
   * Translate content
   */
  static async translateContent(req, res) {
    const { content, sourceLang, targetLang } = req.body;

    const result = await AIService.translateContent({
      content,
      sourceLang,
      targetLang,
      tenantId: req.tenant.id,
    });

    await AIService.trackUsage(req.tenant.id, req.user.userId, result.tokensUsed);

    ApiResponse.success(res, 200, 'Content translated', {
      translatedContent: result.translatedContent,
      sourceLang,
      targetLang,
      tokensUsed: result.tokensUsed,
    });
  }

  /**
   * Optimize content for SEO
   */
  static async optimizeSEO(req, res) {
    const { content, keywords, type } = req.body;

    const result = await AIService.optimizeSEO({
      content,
      keywords,
      type,
      tenantId: req.tenant.id,
    });

    ApiResponse.success(res, 200, 'SEO optimization complete', {
      optimizedContent: result.optimizedContent,
      suggestions: result.suggestions,
      score: result.score,
    });
  }

  /**
   * Get AI usage statistics
   */
  static async getUsage(req, res) {
    const usage = await AIService.getTenantUsage(req.tenant.id);

    const planLimits = {
      free: 10000,
      pro: 100000,
      business: 500000,
      enterprise: -1, // unlimited
    };

    const limit = planLimits[req.tenant.plan] || planLimits.free;
    const percentage = limit > 0 ? (usage.totalTokens / limit) * 100 : 0;

    ApiResponse.success(res, 200, 'Usage retrieved', {
      totalTokens: usage.totalTokens,
      limit,
      percentage: Math.min(percentage, 100),
      remaining: limit > 0 ? Math.max(0, limit - usage.totalTokens) : Infinity,
      history: usage.history,
    });
  }
}

export default AIController;
