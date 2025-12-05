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
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...getTypeOrmConfig(configService),
        entities: [User, Patient, PsychologistProfile, Message, Appointment, Availability],
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    PatientsModule,
    AuthModule,
    AppointmentsModule,
    PsychologistsModule,
    VisioModule,
    ChatModule,
  ],
})
export class AppModule {}
