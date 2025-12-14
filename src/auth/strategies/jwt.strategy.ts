/**
 * Stratégie JWT pour l'authentification des access tokens
 * 
 * Cette stratégie est utilisée par JwtAuthGuard pour valider les access tokens.
 * Elle configure Passport pour extraire et vérifier les JWT dans les requêtes HTTP.
 * 
 * @module auth/strategies
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../users/user.entity';

/**
 * Interface du payload JWT
 * 
 * Structure attendue dans le JWT après décodage.
 */
export interface JwtPayload {
  sub: string;      // Subject = User ID
  email: string;    // Email de l'utilisateur
  role: UserRole;   // Rôle (PATIENT / PSY / ADMIN)
}

/**
 * Stratégie JwtStrategy
 * 
 * Configure Passport-JWT pour :
 * 1. Extraire le token de l'en-tête Authorization: Bearer <token>
 * 2. Vérifier la signature avec JWT_ACCESS_SECRET
 * 3. Vérifier l'expiration
 * 4. Transformer le payload en objet req.user
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  /**
   * Constructeur - Configuration de la stratégie
   * 
   * @param configService - Service pour accéder au secret JWT
   */
  constructor(private readonly configService: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      /**
       * Extraction du JWT depuis l'en-tête Authorization
       * 
       * Attend le format : Authorization: Bearer <token>
       * Passport extrait automatiquement la partie <token>
       */
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      /**
       * Respect de l'expiration
       * 
       * ignoreExpiration: false signifie que si le token est expiré,
       * la requête est automatiquement rejetée avec 401 Unauthorized.
       */
      ignoreExpiration: false,
      
      /**
       * Secret de vérification
       * 
       * Doit correspondre au secret utilisé lors de la signature du token
       * dans AuthService.generateTokens()
       */
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Méthode validate - Transformation du payload
   * 
   * Cette méthode est appelée AUTOMATIQUEMENT par Passport après validation du JWT.
   * Elle est exécutée UNIQUEMENT si :
   * - Le token est bien signé (signature valide)
   * - Le token n'est pas expiré
   * 
   * Ce qu'on retourne ici sera injecté dans req.user et accessible
   * dans tous les controllers et guards suivants.
   * 
   * @param payload - Le payload décodé du JWT
   * @returns L'objet utilisateur à injecter dans req.user
   * 
   * @example
   * Dans un controller :
   * ```typescript
   * @UseGuards(JwtAuthGuard)
   * @Get('profile')
   * getProfile(@Req() req) {
   *   // req.user contient { id, email, role }
   *   console.log(req.user.id);
   * }
   * ```
   */
  validate(payload: JwtPayload) {
    return {
      id: payload.sub,      // On renomme 'sub' en 'id' pour plus de clarté
      email: payload.email,
      role: payload.role,
    };
  }
}
