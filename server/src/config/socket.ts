import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from './env';
import { redisPub, redisSub } from './redis';
import { socketConnections } from '../utils/metrics';

let io: Server | null = null;

export const initializeSocket = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin:      env.CLIENT_URL,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  // Adapter Redis — permet le scaling multi-instances
  io.adapter(createAdapter(redisPub, redisSub));

  io.on('connection', (socket: Socket) => {
    socketConnections.inc();

    socket.on('join', (userId: string) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on('leave', (userId: string) => {
      if (userId) socket.leave(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      socketConnections.dec();
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

// Helper function to emit notification to a specific user
export const emitNotificationToUser = (userId: string, notification: any) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
};

// Helper function to emit order update to a specific user
export const emitOrderUpdateToUser = (userId: string, order: any) => {
  if (io) {
    io.to(`user:${userId}`).emit('orderUpdate', order);
  }
};

// Helper function to broadcast to all connected clients (for admin broadcasts)
export const broadcastNotification = (notification: any) => {
  if (io) {
    io.emit('broadcast', notification);
  }
};
