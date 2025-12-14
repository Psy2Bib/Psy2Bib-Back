/**
 * Module Psychologists - Gestion des profils publics des psychologues
 * 
 * Ce module gère tout ce qui concerne les profils professionnels des psychologues :
 * - Création et mise à jour de profil
 * - Recherche publique avec filtres
 * - Visibilité et informations professionnelles
 * 
 * @module PsychologistsModule
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PsychologistsController } from './psychologists.controller';
import { PsychologistsService } from './psychologists.service';
import { PsychologistProfile } from './entities/psychologist-profile.entity';
import { User } from '../users/user.entity';

/**
 * Configuration du module Psychologists
 * 
 * Expose l'API de recherche et de gestion des profils psychologues.
 * Utilisé par AuthModule lors de l'inscription des PSY, et par les patients
 * pour trouver un psychologue.
 */
@Module({
  /**
   * TypeORM
   * 
   * Enregistre les entités PsychologistProfile et User.
   * User est nécessaire pour créer des profils (relation OneToOne).
   */
  imports: [TypeOrmModule.forFeature([PsychologistProfile, User])],
  
  /**
   * Controllers
   * 
   * PsychologistsController expose les routes de recherche et de gestion de profil.
   */
  controllers: [PsychologistsController],
  
  /**
   * Services
   * 
   * PsychologistsService contient la logique métier.
   */
  providers: [PsychologistsService],
  
  /**
   * Exports
   * 
   * PsychologistsService est exporté pour être utilisé par AuthModule
   * lors de la création automatique du profil à l'inscription.
   */
  exports: [PsychologistsService],
})
export class PsychologistsModule {}
