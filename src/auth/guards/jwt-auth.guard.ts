/**
 * Guard JWT pour les routes HTTP protégées
 * 
 * Ce guard protège les routes qui nécessitent une authentification.
 * Il utilise la stratégie JWT (JwtStrategy) pour valider l'access token.
 * 
 * Utilisation : @UseGuards(JwtAuthGuard) sur un controller ou une route.
 * 
 * @module auth/guards
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JwtAuthGuard
 * 
 * Hérite de AuthGuard de Passport et utilise la stratégie 'jwt'.
 * 
 * Workflow :
 * 1. Extrait le token de l'en-tête Authorization: Bearer <token>
 * 2. Vérifie la signature du JWT avec JWT_ACCESS_SECRET
 * 3. Vérifie que le token n'est pas expiré
 * 4. Appelle JwtStrategy.validate() pour enrichir req.user
 * 5. Si tout est OK, la requête continue, sinon 401 Unauthorized
 * 
 * Le résultat de validate() est injecté dans req.user :
 * { id: string, email: string, role: UserRole }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
