/**
 * Module Patients - Gestion des dossiers patients chiffrés
 * 
 * Ce module gère les données sensibles des patients selon le principe Zero-Knowledge.
 * Toutes les données sont chiffrées côté client avant d'être stockées.
 * 
 * @module PatientsModule
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './patient.entity';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';

/**
 * Configuration du module Patients
 * 
 * Module simple qui expose l'API de gestion des profils patients chiffrés.
 * Utilisé par AuthModule lors de l'inscription et par PatientsController
 * pour les mises à jour.
 */
@Module({
  /**
   * Configuration TypeORM
   * 
   * Enregistre l'entité Patient pour la manipulation via Repository.
   */
  imports: [TypeOrmModule.forFeature([Patient])],
  
  /**
   * Services
   * 
   * PatientsService gère la logique métier (CRUD des blobs chiffrés).
   */
  providers: [PatientsService],
  
  /**
   * Controllers
   * 
   * PatientsController expose les routes /patients/me (GET/PATCH).
   */
  controllers: [PatientsController],
  
  /**
   * Exports
   * 
   * PatientsService est exporté pour être utilisé par AuthModule
   * lors de la création de compte patient.
   */
  exports: [PatientsService],
})
export class PatientsModule {}
