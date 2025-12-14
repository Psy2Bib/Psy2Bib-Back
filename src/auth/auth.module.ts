/**
 * Module Auth - Authentification et autorisation
 * 
 * Ce module encapsule toute la logique d'authentification JWT de l'application.
 * Il configure Passport avec les stratégies JWT et expose les endpoints d'auth.
 * 
 * @module AuthModule
 */

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PatientsModule } from '../patients/patients.module';
import { PsychologistsModule } from '../psychologists/psychologists.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

/**
 * Configuration du module Auth
 * 
 * Ce module importe les modules nécessaires (Users, Patients, Psychologists)
 * et configure Passport + JWT pour l'authentification.
 */
@Module({
  imports: [
    /**
     * ConfigModule
     * 
     * Donne accès aux variables d'environnement (secrets JWT, durées d'expiration)
     */
    ConfigModule,
    
    /**
     * UsersModule
     * 
     * Importe UsersService pour manipuler les utilisateurs (login, register, etc.)
     */
    UsersModule,
    
    /**
     * PatientsModule
     * 
     * Importe PatientsService pour gérer les dossiers chiffrés des patients
     */
    PatientsModule,
    
    /**
     * PsychologistsModule
     * 
     * Importe PsychologistsService pour créer les profils psychologues
     */
    PsychologistsModule,
    
    /**
     * PassportModule
     * 
     * Configure Passport avec 'jwt' comme stratégie par défaut.
     * Passport est le middleware d'authentification utilisé par NestJS.
     */
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    /**
     * JwtModule
     * 
     * Configure le module JWT de NestJS.
     * On utilise register({}) vide car chaque stratégie définit son propre secret.
     * Ça permet d'avoir des secrets différents pour access et refresh tokens.
     */
    JwtModule.register({}),
  ],
  
  /**
   * Controllers
   * 
   * AuthController expose les routes d'authentification.
   */
  controllers: [AuthController],
  
  /**
   * Providers
   * 
   * - AuthService : Logique métier de l'authentification
   * - JwtStrategy : Validation des access tokens
   * - JwtRefreshStrategy : Validation des refresh tokens
   */
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  
  /**
   * Exports
   * 
   * AuthService est exporté pour être utilisé dans d'autres modules
   * si nécessaire (bien que rare, généralement on utilise les guards).
   */
  exports: [AuthService],
})
export class AuthModule {}
