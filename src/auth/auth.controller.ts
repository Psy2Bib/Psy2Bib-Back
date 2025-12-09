import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request } from 'express';
import { UserRole } from '../users/user.entity';

// Interface étendant Request pour inclure l'utilisateur authentifié
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

@ApiTags('auth') // Regroupe toutes les routes sous le tag 'auth' dans Swagger
@Controller('auth') // Préfixe des routes : /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint d'inscription
   * Crée un nouvel utilisateur (PSY ou PATIENT)
   */
  @Post('register')
  @ApiOperation({
    summary: "Inscription d'un nouvel utilisateur",
    description: 'Crée un nouveau compte utilisateur (PSY ou PATIENT)',
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  /**
   * Endpoint de connexion
   * Authentifie un utilisateur et retourne les tokens JWT
   */
  @Post('login')
  @ApiOperation({
    summary: "Connexion d'un utilisateur",
    description: 'Authentifie un utilisateur et retourne les tokens JWT',
  })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  /**
   * Endpoint de rafraîchissement de tokens
   * Nécessite un refresh token valide (JwtRefreshGuard)
   */
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ApiBearerAuth('JWT-auth') // Indique que ce endpoint nécessite un token Bearer
  @ApiOperation({
    summary: 'Rafraîchir les tokens',
    description: "Génère de nouveaux tokens d'accès et de rafraîchissement",
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens rafraîchis avec succès',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de rafraîchissement invalide',
  })
  async refresh(@Req() req: RequestWithUser): Promise<AuthResponseDto> {
    const { id } = req.user; // Récupère l'id de l'utilisateur depuis le refresh token
    return this.authService.refreshTokens(id);
  }

  /**
   * Endpoint de déconnexion
   * Nécessite un access token valide (JwtAuthGuard)
   * Invalide le refresh token en base de données
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Déconnexion',
    description:
      "Invalide le refresh token de l'utilisateur (suppression en base)",
  })
  @ApiResponse({
    status: 200,
    description: 'Déconnexion réussie',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async logout(@Req() req: RequestWithUser): Promise<void> {
    const { id } = req.user; // Récupère l'id de l'utilisateur depuis le access token
    await this.authService.logout(id);
  }
}
