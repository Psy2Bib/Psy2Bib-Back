import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../users/user.entity';

@Injectable() // Rend la stratégie injectable via le système de DI de NestJS
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access', // Nom unique pour cette stratégie, utile si on a plusieurs stratégies JWT
) {
  constructor(configService: ConfigService) {
    // Configure la stratégie JWT avec Passport
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      // Récupère le JWT depuis le header Authorization (Bearer token)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Utilise la clé secrète définie dans les variables d'environnement
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  // La méthode validate est appelée automatiquement après vérification du JWT
  // Elle transforme le payload du token en objet utilisateur utilisable dans l'application
  validate(payload: { sub: string; email: string; role: UserRole }) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
