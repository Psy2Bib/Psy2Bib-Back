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
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const token = this.extractTokenFromHandshake(client);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      });

      // On attache l'utilisateur au socket pour y accéder plus tard
      // Payload = { sub: userId, email, role, ... }

      client.user = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        id: payload.sub,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        email: payload.email,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    // 1. Essayer dans auth { token: ... } (standard Socket.IO v4)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const authHeader = client.handshake.auth.token;
    if (authHeader && typeof authHeader === 'string') {
      // Si le client envoie "Bearer xyz", on nettoie
      return authHeader.replace('Bearer ', '');
    }

    // 2. Fallback: query param ?token=... (moins sécurisé mais courant)
    const queryToken = client.handshake.query.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    // 3. Fallback: headers standard (si le transport est polling, parfois passé)
    const authorization = client.handshake.headers.authorization;
    if (authorization) {
      return authorization.replace('Bearer ', '');
    }

    return undefined;
  }
}
