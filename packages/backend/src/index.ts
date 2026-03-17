import Fastify from 'fastify';
import cors from '@fastify/cors';
import { campaignRoutes } from './routes/campaigns.js';
import { analyticsRoutes } from './routes/analytics.js';
import { createSimulatorRoutes } from './routes/simulator.js';
import { AuctionSimulator } from './simulator/auction-simulator.js';
import { setupSocketServer } from './ws/socket-server.js';

const PORT = parseInt(process.env.PORT ?? '3001');

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  const simulator = new AuctionSimulator();

  await app.register(campaignRoutes);
  await app.register(analyticsRoutes);
  await app.register(createSimulatorRoutes(simulator));

  // Set up Socket.IO on the raw server before listen
  setupSocketServer(app.server, simulator);

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Atrium backend running on http://localhost:${PORT}`);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
