/**
 * Module racine de l'application Psy2Bib Backend
 * 
 * Ce module orchestre toute l'architecture de l'application en important
 * et configurant tous les modules fonctionnels (auth, appointments, chat, etc.)
 * ainsi que les modules techniques (TypeORM pour la BDD, Schedule pour les tâches planifiées).
 * 
 * @module AppModule
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { getTypeOrmConfig } from './config/ormconfig';

// Import des modules métier
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PsychologistsModule } from './psychologists/psychologists.module';
import { ChatModule } from './chat/chat.module';
import { CalendarModule } from './calendar/calendar.module';
import { PsyTasksModule } from './psy-tasks/psy-tasks.module';

// Import des entités pour TypeORM
import { User } from './users/user.entity';
import { Patient } from './patients/patient.entity';
import { PsychologistProfile } from './psychologists/entities/psychologist-profile.entity';
import { Message } from './chat/entities/message.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { Availability } from './appointments/entities/availability.entity';

/**
 * Module principal de l'application
 * 
 * Ce décorateur @Module configure l'ensemble de l'application NestJS.
 * Il regroupe tous les modules fonctionnels et configure les services
 * transversaux comme la base de données et les tâches planifiées.
 */
@Module({
  imports: [
    /**
     * ConfigModule - Gestion de la configuration
     * 
     * Configure le chargement des variables d'environnement depuis le fichier .env.
     * L'option `isGlobal: true` rend le ConfigService accessible dans tous les modules
     * sans avoir besoin de réimporter ConfigModule à chaque fois.
     * 
     * Les variables typiques incluent : DB_HOST, DB_PORT, JWT_SECRET, etc.
     */
    ConfigModule.forRoot({ isGlobal: true }),
    
    /**
     * ScheduleModule - Tâches planifiées (Cron Jobs)
     * 
     * Permet de définir des tâches qui s'exécutent automatiquement à intervalles réguliers.
     * Par exemple, on l'utilise pour mettre à jour automatiquement le statut des rendez-vous
     * (passer de "PENDING" à "CONFIRMED" ou gérer les expirations).
     */
    ScheduleModule.forRoot(),
    
    /**
     * TypeORM - Configuration de la base de données PostgreSQL
     * 
     * TypeORM est notre ORM (Object-Relational Mapping) qui permet de manipuler
     * la base de données avec des objets TypeScript plutôt que du SQL brut.
     * 
     * Configuration asynchrone car elle dépend du ConfigService pour charger
     * les paramètres de connexion depuis les variables d'environnement.
     */
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        // Récupération de la config de base depuis ormconfig.ts
        ...getTypeOrmConfig(configService),
        
        /**
         * Liste des entités (tables) de l'application
         * 
         * Chaque entité représente une table dans PostgreSQL :
         * - User : Utilisateurs (patients, psychologues, admins)
         * - Patient : Données chiffrées des patients (Zero-Knowledge)
         * - PsychologistProfile : Profils publics des psychologues
         * - Message : Messages chiffrés de bout en bout
         * - Appointment : Rendez-vous entre patients et psychologues
         * - Availability : Créneaux de disponibilité des psychologues (30 min chacun)
         */
        entities: [User, Patient, PsychologistProfile, Message, Appointment, Availability],
        
        /**
         * autoLoadEntities : true
         * 
         * Active le chargement automatique des entités depuis les modules.
         * Ça permet de ne pas avoir à lister manuellement toutes les entités,
         * TypeORM les découvre automatiquement.
         */
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    
    /**
     * Modules métier de l'application
     * 
     * Chaque module encapsule une fonctionnalité spécifique :
     * - UsersModule : Gestion des utilisateurs (CRUD de base)
     * - PatientsModule : Gestion des profils patients chiffrés
     * - AuthModule : Authentification JWT, login, register, refresh tokens
     * - AppointmentsModule : Gestion des rendez-vous et disponibilités
     * - PsychologistsModule : Profils publics des psys, recherche
     * - ChatModule : Messagerie instantanée chiffrée (E2EE)
     * - CalendarModule : Gestion du calendrier et des événements
     * - PsyTasksModule : Tâches/notes privées des psychologues
     */
    UsersModule,
    PatientsModule,
    AuthModule,
    AppointmentsModule,
    PsychologistsModule,
    ChatModule,
    CalendarModule,
    PsyTasksModule,
  ],
})
export class AppModule {}
