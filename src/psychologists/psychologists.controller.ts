/**
 * Contrôleur Psychologists - API de gestion des profils psychologues
 * 
 * Expose les endpoints pour :
 * - Rechercher des psychologues (public)
 * - Gérer son propre profil (PSY authentifié)
 * 
 * @module psychologists
 */

import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PsychologistsService } from './psychologists.service';
import { UpdatePsychologistProfileDto } from './dto/update-psychologist-profile.dto';
import { SearchPsychologistDto } from './dto/search-psychologist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

/**
 * Interface pour une requête authentifiée
 */
interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

/**
 * Contrôleur PsychologistsController
 * 
 * Routes mixtes : certaines publiques (recherche), d'autres protégées (gestion profil).
 */
@ApiTags('psychologists')
@Controller('psychologists')
export class PsychologistsController {
  constructor(private readonly psychologistsService: PsychologistsService) {}

  /**
   * GET /psychologists - Recherche publique de psychologues
   * 
   * Route PUBLIQUE (pas de guard) pour que les patients non-connectés
   * puissent découvrir les psychologues disponibles.
   * 
   * Filtres possibles :
   * - name : Recherche dans le pseudo
   * - specialty : Filtrage par spécialité (ex: "TCC")
   * - language : Filtrage par langue (ex: "Anglais")
   * 
   * @param query - Critères de recherche (tous optionnels)
   * @returns Liste des profils correspondants
   * 
   * @example
   * GET /psychologists?specialty=TCC&language=Français
   */
  @Get()
  @ApiOperation({
    summary: 'Rechercher des psychologues',
    description: 'Recherche publique par nom, spécialité, langue',
  })
  @ApiResponse({ status: 200, description: 'Liste des profils trouvés' })
  async search(@Query() query: SearchPsychologistDto) {
    return this.psychologistsService.search(query);
  }

  /**
   * PUT /psychologists/me - Mettre à jour mon profil public
   * 
   * Permet au psychologue de créer/modifier son profil public.
   * Protégé par JWT - seul le psychologue peut modifier son propre profil.
   * 
   * Informations modifiables :
   * - Titre, description, ADELI
   * - Spécialités, langues
   * - Ville, adresse, tarif
   * - Visibilité dans la recherche
   * 
   * @param req - Requête avec user.id du psychologue
   * @param dto - Nouvelles données du profil (mise à jour partielle)
   * @returns Le profil mis à jour
   */
  @UseGuards(JwtAuthGuard)
  @Put('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mettre à jour mon profil public (PSY)',
    description:
      'Crée ou met à jour le profil public (spécialités, langues, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async updateMyProfile(
    @Req() req: AuthRequest,
    @Body() dto: UpdatePsychologistProfileDto,
  ) {
    return this.psychologistsService.updateProfile(req.user.id, dto);
  }

  /**
   * GET /psychologists/me - Récupérer mon profil public
   * 
   * Permet au psychologue de consulter son propre profil tel qu'il
   * apparaît aux patients.
   * 
   * Utile pour :
   * - Pré-remplir le formulaire d'édition
   * - Vérifier comment son profil est affiché
   * - Obtenir les infos de son profil dans l'interface
   * 
   * @param req - Requête avec user.id
   * @returns Le profil du psychologue connecté
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer mon profil public',
    description: 'Récupère le profil public du psychologue connecté',
  })
  async getMyProfile(@Req() req: AuthRequest) {
    return this.psychologistsService.getProfile(req.user.id);
  }
}
