/**
 * Configuration TypeORM pour la connexion PostgreSQL
 * 
 * Ce fichier centralise la configuration de la base de données.
 * Il récupère les paramètres depuis les variables d'environnement
 * via le ConfigService de NestJS.
 * 
 * @module ormconfig
 */

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';

/**
 * Génère la configuration TypeORM pour PostgreSQL
 * 
 * Cette fonction est appelée au démarrage de l'application pour établir
 * la connexion à la base de données. Elle récupère tous les paramètres
 * sensibles depuis les variables d'environnement pour plus de sécurité.
 * 
 * @param configService - Service NestJS qui donne accès aux variables d'environnement
 * @returns La configuration complète TypeORM prête à l'emploi
 * 
 * @example
 * Variables d'environnement attendues dans le fichier .env :
 * ```
 * DB_HOST=localhost
 * DB_PORT=5432
 * DB_USERNAME=postgres
 * DB_PASSWORD=votremotdepasse
 * DB_NAME=psy2bib
 * ```
 */
export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl =
    configService.get<string>('DATABASE_URL') ||
    configService.get<string>('DB_URL');
  const sslRequired =
    configService.get<string>('DB_SSL') === 'true' ||
    databaseUrl?.includes('neon.tech');
  const sslConfig = sslRequired ? { rejectUnauthorized: false } : undefined;
  const synchronize =
    configService.get<string>('DB_SYNC') === 'true' ? true : false;

  /**
   * Type de base de données
   * 
   * PostgreSQL a été choisi pour sa fiabilité, sa performance
   * et ses fonctionnalités avancées (transactions, JSON, full-text search, etc.)
   */
  const baseConfig = databaseUrl
    ? {
        /**
         * Support d'une URL complète (ex: Neon ou Postgres managé)
         * Forme attendue : postgres://user:password@host:port/dbname
         */
        url: databaseUrl,
      }
    : {
        /**
         * Hôte de la base de données
         * 
         * En local : 'localhost' ou '127.0.0.1'
         * En Docker : nom du service (ex: 'postgres')
         * En production : URL du serveur PostgreSQL
         */
        host: configService.get<string>('DB_HOST'),
        
        /**
         * Port PostgreSQL
         * 
         * Port standard : 5432
         * Peut être personnalisé si plusieurs instances PostgreSQL tournent
         */
        port: configService.get<number>('DB_PORT'),
        
        /**
         * Nom d'utilisateur PostgreSQL
         * 
         * Utilisateur avec les droits de lecture/écriture sur la base
         * En production, éviter d'utiliser le super-utilisateur 'postgres'
         */
        username: configService.get<string>('DB_USERNAME'),
        
        /**
         * Mot de passe PostgreSQL
         * 
         * IMPORTANT : Ne jamais commit ce mot de passe !
         * Toujours le stocker dans les variables d'environnement.
         */
        password: configService.get<string>('DB_PASSWORD'),
        
        /**
         * Nom de la base de données
         * 
         * La base 'psy2bib' doit être créée au préalable
         * (soit manuellement, soit via Docker Compose)
         */
        database: configService.get<string>('DB_NAME'),
      };

  return {
    type: 'postgres',
    ...baseConfig,
    
    /**
     * Liste des entités TypeORM
     * 
     * Note : Cette liste minimale est complétée par l'option
     * autoLoadEntities dans app.module.ts qui découvre
     * automatiquement toutes les entités des modules importés.
     */
    entities: [User],
    
    /**
     * Synchronisation automatique du schéma
     * 
    * synchronize: true signifie que TypeORM va automatiquement créer/modifier
     * les tables en fonction des entités à chaque démarrage.
     * 
     * ATTENTION : À utiliser UNIQUEMENT en développement !
     * En production, mettre DB_SYNC=false et utiliser des migrations pour éviter
     * toute perte de données accidentelle.
     */
    synchronize,
    
    /**
     * Logging des requêtes SQL
     * 
     * logging: true affiche toutes les requêtes SQL dans la console.
     * Très utile pour le debug et l'optimisation des performances.
     * 
     * En production, on peut le désactiver ou utiliser un niveau de log plus fin :
     * - logging: ['error', 'warn'] : seulement les erreurs
     * - logging: false : désactiver complètement
     */
    logging: true,

    /**
     * TLS activé automatiquement pour Neon ou si DB_SSL=true
     */
    ...(sslConfig ? { ssl: sslConfig, extra: { ssl: sslConfig } } : {}),
  };
};
