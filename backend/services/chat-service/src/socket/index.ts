import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { setupSocketHandlers } from './handlers';
import { config } from '../config';

/**
 * Initialize Socket.io server and setup handlers
 */
export const initializeSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
    },
  });

  setupSocketHandlers(io);

  return io;
};

export { setupSocketHandlers };
