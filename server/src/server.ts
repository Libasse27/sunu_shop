import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { initializeSocket } from './config/socket';
import mongoose from 'mongoose';
import logger from './utils/logger';

const startServer = async () => {
  try {
    await connectDatabase();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    initializeSocket(httpServer);

    httpServer.listen(env.PORT, () => {
      logger.info(`Serveur démarré en mode ${env.NODE_ENV}`, {
        api:       `http://localhost:${env.PORT}/api/v1`,
        websocket: `ws://localhost:${env.PORT}`,
        health:    `http://localhost:${env.PORT}/api/health`,
      });
    });

    // Graceful shutdown — gère SIGTERM (Docker stop) et SIGINT (Ctrl+C)
    const shutdown = (signal: string) => {
      logger.info(`${signal} reçu — arrêt propre en cours...`);
      httpServer.close(async () => {
        try {
          await mongoose.connection.close();
          logger.info('Connexion MongoDB fermée.');
        } catch (err) {
          logger.error('Erreur lors de la fermeture MongoDB:', { error: (err as Error).message });
        }
        process.exit(0);
      });

      // Forcer l'arrêt si le shutdown tarde trop (10s)
      setTimeout(() => {
        logger.error('Shutdown forcé après timeout');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Erreur au démarrage du serveur:', { error: (error as Error).message });
    process.exit(1);
  }
};

startServer();
