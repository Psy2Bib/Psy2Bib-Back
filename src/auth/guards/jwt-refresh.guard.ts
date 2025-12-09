import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// JwtRefreshGuard étend le guard de Passport pour la stratégie 'jwt-refresh'
// Il est utilisé pour protéger les routes qui nécessitent un token de rafraîchissement
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
