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

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'psy2bib',
  database: process.env.DB_NAME || 'psy2bib',
  
  // Découverte automatique des entités
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  
  // Découverte automatique des migrations
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  
  // Synchronisation désactivée pour les migrations
  synchronize: false,
});
