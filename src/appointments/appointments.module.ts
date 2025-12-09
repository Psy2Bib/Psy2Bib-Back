import { Module } from '@nestjs/common'; // Import du décorateur Module de NestJS
import { TypeOrmModule } from '@nestjs/typeorm'; // Import pour intégrer TypeORM dans le module
import { AppointmentsService } from './appointments.service'; // Import du service de gestion des rendez-vous
import { AppointmentsController } from './appointments.controller'; // Import du controller pour exposer les routes
import { Availability } from './entities/availability.entity'; // Import de l'entité Availability
import { Appointment } from './entities/appointment.entity'; // Import de l'entité Appointment

@Module({
  imports: [TypeOrmModule.forFeature([Availability, Appointment])], 
  // Déclare les entités à injecter dans TypeORM pour ce module
  providers: [AppointmentsService], 
  // Fournit le service AppointmentsService pour ce module
  controllers: [AppointmentsController], 
  // Déclare le controller qui gère les routes
  exports: [AppointmentsService], 
  // Permet à d'autres modules d'utiliser AppointmentsService
})
export class AppointmentsModule {} // Définition du module Appointments
