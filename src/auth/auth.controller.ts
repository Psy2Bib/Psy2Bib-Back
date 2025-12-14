/**
 * Contrôleur d'authentification
 * 
 * Expose les endpoints HTTP pour l'authentification :
 * - POST /auth/register : Inscription
 * - POST /auth/login : Connexion
 * - POST /auth/refresh : Rafraîchissement des tokens
 * - POST /auth/logout : Déconnexion
 * 
 * @module auth
 */

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

/**
 * Interface pour une requête avec utilisateur authentifié
 * 
 * Après passage par un guard JWT, req.user est enrichi avec les infos utilisateur.
 */
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Contrôleur AuthController
 * 
 * Point d'entrée pour toutes les opérations d'authentification.
 * Toutes les routes sont publiques sauf refresh et logout qui nécessitent un token.
 * 
 * Swagger : Tagué 'auth' pour regrouper dans la documentation.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register - Inscription d'un nouvel utilisateur
   * 
   * Crée un nouveau compte utilisateur (patient ou psychologue).
   * Pour les patients, crée aussi le dossier chiffré Zero-Knowledge.
   * 
   * @param dto - Données d'inscription (email, passwordHash, role, blobs chiffrés)
   * @returns Tokens JWT + infos utilisateur + blobs chiffrés
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
   * POST /auth/login - Connexion d'un utilisateur
   * 
   * Authentifie un utilisateur avec son email et son hash de mot de passe.
   * Génère de nouveaux tokens JWT pour la session.
   * 
   * @param dto - Email et passwordHash
   * @returns Tokens JWT + infos utilisateur + blobs chiffrés (si patient)
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
   * POST /auth/refresh - Rafraîchissement des tokens
   * 
   * Génère de nouveaux access et refresh tokens en utilisant un refresh token valide.
   * Protégé par JwtRefreshGuard qui valide le refresh token.
   * 
   * Le client doit envoyer : Authorization: Bearer <refreshToken>
   * 
   * @param req - Requête enrichie avec req.user par le guard
   * @returns Nouveaux tokens JWT + infos utilisateur
   */
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ApiBearerAuth('JWT-auth') // Swagger : indique qu'un token est requis
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
    const { id } = req.user;
    return this.authService.refreshTokens(id);
  }

  /**
   * POST /auth/logout - Déconnexion
   * 
   * Invalide le refresh token de l'utilisateur en le supprimant de la base.
   * Après cette opération, le refresh token ne peut plus être utilisé.
   * 
   * Note : L'access token reste valide jusqu'à son expiration naturelle.
   * Pour une sécurité maximale, le client devrait aussi supprimer les tokens localement.
   * 
   * Protégé par JwtAuthGuard qui valide l'access token.
   * 
   * @param req - Requête enrichie avec req.user
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
    const { id } = req.user;
    await this.authService.logout(id);
  }
}
