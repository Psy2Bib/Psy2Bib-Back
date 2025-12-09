import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../users/user.entity';

// Interface définissant la structure du payload attendu dans le access token
export interface JwtPayload {
  sub: string; // ID de l'utilisateur
  email: string; // Email de l'utilisateur
  role: UserRole; // Rôle de l'utilisateur
}

@Injectable() // Rend la stratégie injectable via le système de dépendances de NestJS
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    // Configuration de la stratégie JWT pour les access tokens
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      // Récupère le token depuis le header Authorization (Bearer <token>)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Vérifie l'expiration du token
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'), // Clé secrète spécifique au access token
    });
  }

  /**
   * Cette méthode est appelée AUTOMATIQUEMENT si :
   * - le token est bien signé
   * - il n'est pas expiré
   *
   * Ce que l'on retourne ici sera injecté dans `req.user`
   */
  validate(payload: JwtPayload) {
    // Retourne un objet utilisateur minimal pour l'injection dans la requête
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
