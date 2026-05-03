import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from './env';
import { redisPub, redisSub } from './redis';
import { socketConnections } from '../utils/metrics';
import type { IOrder } from '../models/Order.model';

// Payload minimal pour les événements socket (subset sérialisable)
interface NotificationPayload {
  _id?:      string;
  id?:       string | null;
  type:      string;
  title:     string;
  message:   string;
  link?:     string;
  data?:     Record<string, unknown>;
  createdAt?: Date;
  timestamp?: string;
}

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

export const emitNotificationToUser = (userId: string, notification: NotificationPayload) => {
  if (io) io.to(`user:${userId}`).emit('notification', notification);
};

export const emitOrderUpdateToUser = (userId: string, order: Partial<IOrder>) => {
  if (io) io.to(`user:${userId}`).emit('orderUpdate', order);
};

export const broadcastNotification = (notification: NotificationPayload) => {
  if (io) io.emit('broadcast', notification);
};
