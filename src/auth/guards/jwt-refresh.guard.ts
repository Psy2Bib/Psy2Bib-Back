/**
 * Guard JWT pour le rafraîchissement des tokens
 * 
 * Ce guard protège la route POST /auth/refresh qui permet d'obtenir
 * un nouvel access token en utilisant un refresh token.
 * 
 * Utilise la stratégie 'jwt-refresh' qui valide avec JWT_REFRESH_SECRET.
 * 
 * @module auth/guards
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JwtRefreshGuard
 * 
 * Similaire à JwtAuthGuard mais utilise la stratégie 'jwt-refresh'.
 * 
 * Différence importante :
 * - JwtAuthGuard valide les access tokens (secret: JWT_ACCESS_SECRET)
 * - JwtRefreshGuard valide les refresh tokens (secret: JWT_REFRESH_SECRET)
 * 
 * Cette séparation permet d'avoir deux secrets différents pour plus de sécurité.
 * Si un access token fuit, le refresh token reste protégé.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
