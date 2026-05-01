import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { initializeSocket } from './config/socket';
import mongoose from 'mongoose';
import logger from './utils/logger';

// Point d'entrée principal : connecte la base de données, démarre HTTP + WebSocket
const startServer = async () => {
  try {
    // 1. Connexion MongoDB avant toute écoute HTTP
    await connectDatabase();

    // 2. Création du serveur HTTP wrappant l'app Express
    const httpServer = createServer(app);

    // 3. Attachement de Socket.io au serveur HTTP (notifications temps réel)
    initializeSocket(httpServer);

    httpServer.listen(env.PORT, () => {
      const baseUrl = `http://localhost:${env.PORT}`;

      console.clear();

      logger.info(`
╔══════════════════════════════════════════════════════════════╗
║                    SERVEUR DÉMARRÉ                          ║
╠══════════════════════════════════════════════════════════════╣
║ Environnement : ${env.NODE_ENV.padEnd(43)}║
║ Port          : ${String(env.PORT).padEnd(43)}║
║ API URL       : ${`${baseUrl}/api/v1`.padEnd(43)}║
║ Health Check  : ${`${baseUrl}/api/health`.padEnd(43)}║
║ WebSocket     : ${`ws://localhost:${env.PORT}`.padEnd(43)}║
║ PID Process   : ${String(process.pid).padEnd(43)}║
╚══════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown : ferme proprement HTTP puis MongoDB avant de quitter
    // — SIGTERM : envoyé par Docker/Kubernetes lors d'un arrêt planifié
    // — SIGINT  : Ctrl+C en développement local
    const shutdown = (signal: string) => {
      logger.warn(`
╔══════════════════════════════════════════════════════════════╗
║                 ARRÊT DU SERVEUR EN COURS                   ║
╠══════════════════════════════════════════════════════════════╣
║ Signal reçu : ${signal.padEnd(45)}║
║ Fermeture des connexions HTTP et MongoDB...                 ║
╚══════════════════════════════════════════════════════════════╝
      `);

      // httpServer.close() arrête l'acceptation de nouvelles connexions
      // et attend que les requêtes en cours se terminent
      httpServer.close(async () => {
        try {
          await mongoose.connection.close();

          logger.info(`
╔══════════════════════════════════════════════════════════════╗
║                 SERVEUR ARRÊTÉ PROPREMENT                   ║
╠══════════════════════════════════════════════════════════════╣
║ HTTP Server : Fermé                                         ║
║ MongoDB     : Connexion fermée                              ║
╚══════════════════════════════════════════════════════════════╝
          `);
        } catch (err) {
          logger.error('Erreur lors de la fermeture MongoDB:', {
            error: (err as Error).message,
          });
        }

        process.exit(0);
      });

      // Sécurité : force la sortie si le shutdown dépasse 10 secondes
      // (requêtes bloquées, connexion MongoDB qui ne répond plus, etc.)
      // .unref() évite que ce timer empêche Node de quitter naturellement
      setTimeout(() => {
        logger.error(`
╔══════════════════════════════════════════════════════════════╗
║                  SHUTDOWN FORCÉ APRÈS TIMEOUT               ║
╚══════════════════════════════════════════════════════════════╝
        `);

        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    // Échec critique au démarrage (ex : MongoDB injoignable) → arrêt immédiat
    logger.error(`
╔══════════════════════════════════════════════════════════════╗
║                ERREUR AU DÉMARRAGE DU SERVEUR               ║
╠══════════════════════════════════════════════════════════════╣
║ ${(error as Error).message.padEnd(60)}║
╚══════════════════════════════════════════════════════════════╝
    `);

    process.exit(1);
  }
};

startServer();
