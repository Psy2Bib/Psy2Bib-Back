import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../users/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // on veut que l'exp soit respectée
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Cette méthode est appelée AUTOMATIQUEMENT si :
   * - le token est bien signé
   * - il n'est pas expiré
   *
   * Ce que on retourne ici sera injecté dans `req.user`
   */
  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
