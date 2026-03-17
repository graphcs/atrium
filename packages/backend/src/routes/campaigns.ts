import { FastifyInstance } from 'fastify';
import { CampaignService } from '../services/campaign-service.js';
import type { CampaignStatus } from '@atrium/shared';

const campaignService = new CampaignService();

export async function campaignRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/campaigns', async () => {
    return campaignService.getAll();
  });

  app.get('/api/campaigns/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const campaign = campaignService.getById(id);
    if (!campaign) {
      return reply.code(404).send({ error: 'Campaign not found' });
    }
    return campaign;
  });

  app.post('/api/campaigns', async (req) => {
    const input = req.body as any;
    return campaignService.create(input);
  });

  app.patch('/api/campaigns/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: CampaignStatus };
    const campaign = campaignService.updateStatus(id, status);
    if (!campaign) {
      return reply.code(404).send({ error: 'Campaign not found' });
    }
    return campaign;
  });

  app.delete('/api/campaigns/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const deleted = campaignService.delete(id);
    if (!deleted) {
      return reply.code(404).send({ error: 'Campaign not found' });
    }
    return { success: true };
  });
}
