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

@Module({
  // Modules importés et nécessaires pour le fonctionnement de AuthModule
  imports: [
    ConfigModule, // Pour accéder aux variables d'environnement (JWT secrets, DB, etc.)
    UsersModule, // Module des utilisateurs
    PatientsModule, // Module des patients
    PsychologistsModule, // Module des psychologues
    PassportModule.register({ defaultStrategy: 'jwt' }), // Configuration par défaut de Passport avec JWT
    JwtModule.register({}), // Module JWT, peut être configuré globalement si nécessaire
  ],
  controllers: [AuthController], // Contrôleur gérant les routes /auth
  providers: [
    AuthService, // Service principal pour l'authentification
    JwtStrategy, // Stratégie JWT pour l'access token
    JwtRefreshStrategy, // Stratégie JWT pour le refresh token
  ],
  exports: [AuthService], // Permet à d'autres modules d'utiliser AuthService
})
export class AuthModule {}
