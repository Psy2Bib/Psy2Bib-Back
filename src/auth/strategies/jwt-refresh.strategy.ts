/**
 * Stratégie JWT pour la validation des refresh tokens
 * 
 * Cette stratégie est similaire à JwtStrategy mais elle :
 * 1. Utilise JWT_REFRESH_SECRET au lieu de JWT_ACCESS_SECRET
 * 2. Vérifie que l'utilisateur existe toujours en base
 * 3. Est utilisée uniquement pour la route POST /auth/refresh
 * 
 * @module auth/strategies
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/user.entity';

/**
 * Interface du payload du refresh token
 * 
 * Identique au payload de l'access token.
 * La différence est dans le secret utilisé pour la signature.
 */
export interface JwtRefreshPayload {
  sub: string;      // User ID
  email: string;    // Email
  role: UserRole;   // Rôle
}

/**
 * Stratégie JwtRefreshStrategy
 * 
 * Sécurité supplémentaire :
 * En plus de valider le JWT, on vérifie que l'utilisateur existe toujours.
 * Ça permet de gérer les cas où :
 * - Un utilisateur a été supprimé
 * - Un compte a été désactivé
 * - Un utilisateur s'est déconnecté (refresh token invalidé)
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh', // Nom de la stratégie, utilisé par JwtRefreshGuard
) {
  /**
   * Constructeur
   * 
   * @param configService - Accès au secret JWT refresh
   * @param usersService - Vérification de l'existence de l'utilisateur
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      // Extraction du token depuis Authorization: Bearer <refreshToken>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // Vérification de l'expiration
      ignoreExpiration: false,
      
      /**
       * Secret de vérification des refresh tokens
       * 
       * DIFFÉRENT du secret des access tokens pour une sécurité renforcée.
       * Si un access token fuit, les refresh tokens restent protégés.
       */
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      
      // On n'a pas besoin de la requête complète dans validate()
      passReqToCallback: false,
    });
  }

  /**
   * Validation du refresh token
   * 
   * Contrairement à JwtStrategy, on fait une vérification supplémentaire :
   * on vérifie que l'utilisateur existe toujours en base de données.
   * 
   * Pourquoi ?
   * - Un utilisateur peut être supprimé pendant qu'il a encore un refresh token valide
   * - On veut éviter qu'un token volé soit utilisé après la déconnexion
   * - Donne un point de contrôle centralisé pour révoquer l'accès
   * 
   * @param payload - Payload décodé du refresh token
   * @returns Infos utilisateur pour req.user
   * @throws UnauthorizedException si l'utilisateur n'existe plus
   */
  async validate(payload: JwtRefreshPayload) {
    // Vérification que l'utilisateur existe toujours
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    /**
     * Retour des infos utilisateur
     * 
     * Injecté dans req.user pour être utilisé dans le controller
     * POST /auth/refresh
     */
    return {
      userId: payload.sub,  // On garde 'userId' ici par cohérence avec le code existant
      email: payload.email,
      role: payload.role,
    };
  }
}
