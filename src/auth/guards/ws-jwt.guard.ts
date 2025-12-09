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

export interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Récupération du client Socket.IO actuel
    const client = context.switchToWs().getClient<AuthenticatedSocket>();

    // Extraction du token depuis le handshake
    const token = this.extractTokenFromHandshake(client);

    // Si aucun token n'est trouvé → accès refusé
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Récupère la clé secrète pour vérifier le JWT
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

      // Vérification et décodage du token JWT (throw si invalide / expiré)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      });

      // On attache les infos utilisateur au socket, accessibles partout ensuite
      // payload = { sub: userId, email, role, ... }
      client.user = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        id: payload.sub,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        email: payload.email,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        role: payload.role,
      };

      // Le guard autorise la connexion
      return true;
    } catch {
      // Token invalide ou expiré → accès refusé
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    // 1. Méthode recommandée : handshake.auth.token
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const authHeader = client.handshake.auth.token;
    if (authHeader && typeof authHeader === 'string') {
      // Si le client envoie "Bearer xxx", on supprime le prefixe
      return authHeader.replace('Bearer ', '');
    }

    // 2. Fallback : query param ?token=...
    const queryToken = client.handshake.query.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    // 3. Fallback : header Authorization (rare mais possible selon transport)
    const authorization = client.handshake.headers.authorization;
    if (authorization) {
      return authorization.replace('Bearer ', '');
    }

    // Aucun token trouvé
    return undefined;
  }
}
