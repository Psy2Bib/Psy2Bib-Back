import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './config/ormconfig';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { User } from './users/user.entity';
import { Patient } from './patients/patient.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        ({
          ...getTypeOrmConfig(configService),
          entities: [User, Patient],
        } as any),
      inject: [ConfigService],
    }),
    UsersModule,
    PatientsModule,
    AuthModule,
  ],
})
export class AppModule {}
