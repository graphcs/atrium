import { FastifyInstance } from 'fastify';
import { AnalyticsService } from '../services/analytics-service.js';
import { BidLogger } from '../services/bid-logger.js';

const analyticsService = new AnalyticsService();
const bidLogger = new BidLogger();

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/analytics/metrics', async () => {
    return analyticsService.getMetrics();
  });

  app.get('/api/analytics/by-reseller', async () => {
    return analyticsService.getMetricsByReseller();
  });

  app.get('/api/analytics/recent-bids', async (req) => {
    const { limit } = req.query as { limit?: string };
    return bidLogger.getRecent(limit ? parseInt(limit) : 50);
  });
}
