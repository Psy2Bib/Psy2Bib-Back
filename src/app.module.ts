import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './config/ormconfig';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { User } from './users/user.entity';
import { Patient } from './patients/patient.entity';
import { AppointmentsModule } from './appointments/appointments.module';
import { PsychologistsModule } from './psychologists/psychologists.module';
import { PsychologistProfile } from './psychologists/entities/psychologist-profile.entity';
import { Message } from './chat/entities/message.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { Availability } from './appointments/entities/availability.entity';
import { VisioModule } from './visio/visio.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // Charge les variables d'environnement et les rend accessibles partout dans l'app
    ConfigModule.forRoot({ isGlobal: true }),

    // Configuration TypeORM asynchrone (utilise ConfigService)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      // Récupère la config DB via getTypeOrmConfig + ajoute les entités
      useFactory: (configService: ConfigService) => ({
        ...getTypeOrmConfig(configService),
        // Liste des entités principales du projet
        entities: [
          User,
          Patient,
          PsychologistProfile,
          Message,
          Appointment,
          Availability,
        ],
        autoLoadEntities: true, // Permet à TypeORM de charger automatiquement les entités déclarées dans les modules
      }),
      inject: [ConfigService],
    }),

    // Modules principaux de l’application
    UsersModule,          // Gestion des utilisateurs généraux
    PatientsModule,       // Gestion des patients
    AuthModule,           // Authentification / JWT
    AppointmentsModule,   // Gestion des RDV + disponibilités
    PsychologistsModule,  // Gestion des psychologues
    VisioModule,          // WebSocket & visio
    ChatModule,           // Chat temps réel
  ],
})
export class AppModule {}
