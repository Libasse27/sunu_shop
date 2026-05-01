import mongoose from 'mongoose';
import { env } from './env';
import logger from '../utils/logger';

// Établit la connexion Mongoose et arrête le processus en cas d'échec.
// Appelée une seule fois au démarrage, avant que le serveur HTTP n'écoute.
export const connectDatabase = async (): Promise<void> => {
  try {
    logger.info('Connexion à MongoDB en cours...');

    // mongoose.connect() retourne l'instance Mongoose avec les infos de connexion
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize:              20,
      minPoolSize:               5,
      connectTimeoutMS:      10_000,
      socketTimeoutMS:       45_000,
      serverSelectionTimeoutMS: 5_000,
    });

    logger.info(`
╔══════════════════════════════════════════════════════════════╗
║                  MONGODB CONNECTÉ                           ║
╠══════════════════════════════════════════════════════════════╣
║ Host         : ${conn.connection.host.padEnd(45)}║
║ Database     : ${(conn.connection.name || 'N/A').padEnd(45)}║
║ Port         : ${String(conn.connection.port).padEnd(45)}║
║ Status       : ${'Connexion établie'.padEnd(45)}║
╚══════════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    // Une erreur ici (URI invalide, MongoDB injoignable, auth échouée) est fatale :
    // l'application ne peut pas fonctionner sans base de données
    logger.error(`
╔══════════════════════════════════════════════════════════════╗
║              ERREUR DE CONNEXION MONGODB                    ║
╠══════════════════════════════════════════════════════════════╣
║ ${((error as Error).message || 'Erreur inconnue').padEnd(60)}║
╚══════════════════════════════════════════════════════════════╝
    `);

    process.exit(1);
  }
};
