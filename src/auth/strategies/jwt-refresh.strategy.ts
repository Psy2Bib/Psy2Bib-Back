import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/user.entity';

// Interface définissant la structure du payload attendu dans le refresh token
export interface JwtRefreshPayload {
  sub: string; // ID de l'utilisateur
  email: string; // Email de l'utilisateur
  role: UserRole; // Rôle de l'utilisateur
}

@Injectable() // Rend la stratégie injectable via le système de dépendances de NestJS
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh', // Nom unique pour identifier cette stratégie de refresh token
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    // Configuration de la stratégie JWT pour les refresh tokens
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      // Récupère le token depuis le header Authorization (Bearer <token>)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Vérifie l'expiration du token
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'), // Clé secrète spécifique au refresh token
      passReqToCallback: false, // La requête HTTP n'est pas nécessaire dans validate
    });
  }

  // La méthode validate est appelée après vérification du JWT
  // Elle s'assure que l'utilisateur existe et retourne un objet minimal pour request.user
  async validate(payload: JwtRefreshPayload) {
    const user = await this.usersService.findById(payload.sub); // Recherche l'utilisateur en base
    if (!user) {
      throw new UnauthorizedException('User not found'); // Lance une erreur si l'utilisateur n'existe pas
    }

    // Retourne un objet utilisateur minimal attaché à request.user
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
