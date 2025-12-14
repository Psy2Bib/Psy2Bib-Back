/**
 * Module Users
 * 
 * Module NestJS qui encapsule toute la logique liée à la gestion des utilisateurs.
 * Il configure TypeORM pour l'entité User et expose le UsersService
 * aux autres modules de l'application.
 * 
 * @module UsersModule
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';

/**
 * Configuration du module Users
 * 
 * Ce module est importé par AuthModule, PatientsModule, PsychologistsModule
 * et tous les autres modules qui ont besoin d'accéder aux données utilisateur.
 * 
 * Architecture :
 * - imports : Configure TypeORM pour l'entité User
 * - providers : Rend UsersService disponible dans ce module
 * - exports : Expose UsersService aux autres modules qui importent UsersModule
 */
@Module({
  /**
   * Configuration TypeORM pour l'entité User
   * 
   * TypeOrmModule.forFeature() enregistre l'entité User et génère
   * automatiquement un Repository<User> injectable.
   * 
   * Ça permet d'utiliser @InjectRepository(User) dans les services.
   */
  imports: [TypeOrmModule.forFeature([User])],
  
  /**
   * Services fournis par ce module
   * 
   * UsersService est instancié par le système d'injection de dépendances
   * et peut être injecté dans d'autres services du même module.
   */
  providers: [UsersService],
  
  /**
   * Exports - Services exposés aux autres modules
   * 
   * En exportant UsersService, on permet à d'autres modules (comme AuthModule)
   * d'importer UsersModule et d'utiliser UsersService sans avoir à le réimplémenter.
   * 
   * Pattern : Shared Module
   * UsersModule devient un module partagé réutilisable dans toute l'application.
   */
  exports: [UsersService],
})
export class UsersModule {}
