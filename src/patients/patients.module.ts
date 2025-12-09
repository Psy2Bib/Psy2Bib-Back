import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './patient.entity';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';

/**
 * Module Patients :
 * - Déclare l'entité Patient pour TypeORM
 * - Expose un service métier (PatientsService)
 * - Fournit un contrôleur REST sécurisé (PatientsController)
 *
 * Le module gère tout ce qui concerne les données chiffrées des patients :
 * - récupération des blobs (encryptedMasterKey, salt, encryptedProfile)
 * - mise à jour des données chiffrées
 */
@Module({
  imports: [
    /**
     * Permet d'utiliser le repository Patient via @InjectRepository(Patient)
     * dans le PatientsService.
     */
    TypeOrmModule.forFeature([Patient]),
  ],
  providers: [
    /**
     * Service métier contenant toute la logique d’accès aux données patient.
     */
    PatientsService,
  ],
  controllers: [
    /**
     * Contrôleur exposant les endpoints /patients (GET me, PATCH me).
     */
    PatientsController,
  ],

  /**
   * Export du service pour qu’il puisse être utilisé dans d’autres modules,
   * par exemple AuthModule si tu veux créer un patient automatiquement
   * lors de l'inscription d'un utilisateur.
   */
  exports: [PatientsService],
})
export class PatientsModule {}
