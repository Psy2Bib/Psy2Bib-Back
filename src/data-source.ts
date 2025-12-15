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

const rawDatabaseUrl = process.env.DATABASE_URL || process.env.DB_URL;

/**
 * Normalisation de l'URL de connexion (cloud / Neon / managed Postgres)
 *
 * Certains providers refusent les connexions non chiffrées et exigent
 * sslmode=require. On l'ajoute automatiquement si absent.
 */
const databaseUrl = rawDatabaseUrl
  ? rawDatabaseUrl.includes('sslmode=')
    ? rawDatabaseUrl
    : `${rawDatabaseUrl}${rawDatabaseUrl.includes('?') ? '&' : '?'}sslmode=require`
  : undefined;

const sslRequired =
  process.env.DB_SSL === 'true' || !!databaseUrl || rawDatabaseUrl?.includes('neon.tech');

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
