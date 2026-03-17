import type { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { AuctionSimulator } from '../simulator/auction-simulator.js';

export function setupSocketServer(httpServer: HttpServer, simulator: AuctionSimulator): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  simulator.on('bid_result', (data) => {
    io.emit('bid_result', data);
  });

  simulator.on('metrics', (data) => {
    io.emit('metrics_update', data);
  });

  simulator.on('state', (data) => {
    io.emit('simulator_state', data);
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.emit('simulator_state', simulator.getState());

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
