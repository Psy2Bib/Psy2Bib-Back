/**
 * Configuration DataSource TypeORM pour les migrations
 *
 * Ce fichier configure une instance DataSource utilisée spécifiquement
 * pour la gestion des migrations de base de données.
 *
 * @module data-source
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL;
const sslRequired =
  process.env.DB_SSL === 'true' || databaseUrl?.includes('neon.tech');
const sslConfig = sslRequired ? { rejectUnauthorized: false } : undefined;

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(databaseUrl
    ? {
        /**
         * Connexion via URL complète (Neon ou autre Postgres managé)
         */
        url: databaseUrl,
      }
    : {
        host: process.env.DB_HOST || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'psy2bib',
        database: process.env.DB_NAME || 'psy2bib',
      }),
  
  // Découverte automatique des entités
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  
  // Découverte automatique des migrations
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  
  // Synchronisation désactivée pour les migrations
  synchronize: false,

  /**
   * TLS activé automatiquement pour Neon ou si DB_SSL=true
   */
  ...(sslConfig ? { ssl: sslConfig, extra: { ssl: sslConfig } } : {}),
});
