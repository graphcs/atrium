import { FastifyInstance } from 'fastify';
import { AuctionSimulator } from '../simulator/auction-simulator.js';

export function createSimulatorRoutes(simulator: AuctionSimulator) {
  return async function simulatorRoutes(app: FastifyInstance): Promise<void> {
    app.post('/api/simulator/start', async (req) => {
      const config = req.body as any;
      simulator.start(config);
      return simulator.getState();
    });

    app.post('/api/simulator/stop', async () => {
      simulator.stop();
      return simulator.getState();
    });

    app.post('/api/simulator/reset', async () => {
      simulator.reset();
      return simulator.getState();
    });

    app.patch('/api/simulator/config', async (req) => {
      const config = req.body as any;
      simulator.updateConfig(config);
      return simulator.getState();
    });

    app.get('/api/simulator/state', async () => {
      return simulator.getState();
    });
  };
}
