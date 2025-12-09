import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// JwtAuthGuard étend le guard par défaut fourni par Passport
// utilisant la stratégie 'jwt' (définie dans ton JwtStrategy).
export class JwtAuthGuard extends AuthGuard('jwt') {}
