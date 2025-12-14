/**
 * Guard JWT pour les connexions WebSocket
 * 
 * Ce guard sécurise les connexions WebSocket (Socket.IO) en validant
 * le JWT avant d'autoriser la connexion. Utilisé par les gateways
 * de chat et visio.
 * 
 * Contrairement aux guards HTTP qui utilisent Passport, celui-ci
 * implémente CanActivate directement car les WebSockets ont un
 * cycle de vie différent.
 * 
 * @module auth/guards
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { UserRole } from '../../users/user.entity';

/**
 * Interface pour un socket Socket.IO authentifié
 * 
 * Après validation du JWT, on attache les infos utilisateur
 * directement sur l'objet socket pour y accéder dans les handlers.
 */
export interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Guard WsJwtGuard - Authentification WebSocket
 * 
 * Valide le JWT lors du handshake initial de la connexion WebSocket.
 * Si le token est invalide, la connexion est rejetée.
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Méthode principale du guard
   * 
   * Workflow :
   * 1. Récupère le client WebSocket depuis le contexte
   * 2. Extrait le token JWT du handshake (plusieurs méthodes)
   * 3. Vérifie le token avec JWT_ACCESS_SECRET
   * 4. Attache les infos utilisateur au socket
   * 5. Autorise ou rejette la connexion
   * 
   * @param context - Contexte d'exécution NestJS
   * @returns true si autorisé, sinon lance UnauthorizedException
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Récupération du socket client
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    
    // Extraction du token depuis le handshake
    const token = this.extractTokenFromHandshake(client);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Vérification du JWT avec le secret d'access token
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      });

      /**
       * Injection des infos utilisateur dans le socket
       * 
       * On attache l'utilisateur au socket pour pouvoir l'utiliser
       * dans tous les handlers de messages WebSocket.
       * Le payload contient { sub: userId, email, role, ... }
       */
      client.user = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        id: payload.sub,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        email: payload.email,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        role: payload.role,
      };

      return true; // Connexion autorisée
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Extraction du token JWT depuis le handshake Socket.IO
   * 
   * Socket.IO permet plusieurs façons de passer le token.
   * On les essaie toutes dans l'ordre de préférence :
   * 
   * 1. auth.token (recommandé, Socket.IO v4+)
   *    Côté client : io.connect(url, { auth: { token: 'xxx' } })
   * 
   * 2. query.token (fallback, moins sécurisé car visible dans les logs)
   *    Côté client : io.connect(url + '?token=xxx')
   * 
   * 3. headers.authorization (si transport HTTP long-polling)
   *    Côté client : io.connect(url, { extraHeaders: { authorization: 'Bearer xxx' } })
   * 
   * @param client - Socket Socket.IO
   * @returns Le token JWT si trouvé, sinon undefined
   */
  private extractTokenFromHandshake(client: Socket): string | undefined {
    // Méthode 1 : auth { token: ... } (standard Socket.IO v4)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const authHeader = client.handshake.auth.token;
    if (authHeader && typeof authHeader === 'string') {
      // Si le client envoie "Bearer xyz", on nettoie
      return authHeader.replace('Bearer ', '');
    }

    // Méthode 2 : query param ?token=... (fallback)
    const queryToken = client.handshake.query.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    // Méthode 3 : headers standard Authorization
    const authorization = client.handshake.headers.authorization;
    if (authorization) {
      return authorization.replace('Bearer ', '');
    }

    return undefined;
  }
}
