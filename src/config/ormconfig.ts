import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';

/**
 * Génère la configuration TypeORM en utilisant ConfigService.
 * Cette fonction est utilisée dans AppModule via TypeOrmModule.forRootAsync.
 */
export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres', // Base de données PostgreSQL

  // Paramètres de connexion récupérés depuis les variables d'environnement
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),

  /**
   * Liste des entités chargées par TypeORM.
   * ⚠️ Pour le moment, seule l’entité User est incluse.
   * Il faudra ajouter d’autres entités si tu veux qu’elles soient prises en compte.
   */
  entities: [User],

  /**
   * synchronize:
   * - en dev : facilite automatiquement la création/maj du schéma
   * - en prod : DANGEREUX (risque de perte de données)
   */
  synchronize: true,

  // Active les logs SQL dans la console (pratique pour debug)
  logging: true,
});
