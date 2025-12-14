/**
 * Contrôleur Patients - API pour la gestion des dossiers patients
 * 
 * Expose deux endpoints pour que les patients gèrent leurs données chiffrées :
 * - GET /patients/me : Récupérer ses blobs chiffrés
 * - PATCH /patients/me : Mettre à jour ses blobs chiffrés
 * 
 * Toutes les routes sont protégées par JWT et accessible uniquement
 * par le patient lui-même.
 * 
 * @module patients
 */

import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateEncryptedProfileDto } from './dto/update-encrypted-profile.dto';
import { Request } from 'express';

/**
 * Interface pour une requête authentifiée
 */
interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Contrôleur PatientsController
 * 
 * Toutes les routes nécessitent une authentification JWT (JwtAuthGuard).
 * Le patient ne peut accéder qu'à ses propres données.
 */
@ApiTags('patients')
@ApiBearerAuth('JWT-auth')
@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * GET /patients/me - Récupérer mon profil chiffré
   * 
   * Retourne les trois blobs chiffrés du patient connecté :
   * - encryptedMasterKey : Clé maîtresse chiffrée
   * - salt : Sel de dérivation
   * - encryptedProfile : Profil médical chiffré
   * 
   * Le client peut ensuite déchiffrer localement ces données
   * avec le mot de passe de l'utilisateur.
   * 
   * @param req - Requête HTTP avec req.user injecté par le guard
   * @returns Les blobs chiffrés du patient
   */
  @Get('me')
  @ApiOperation({
    summary: 'Récupérer mon profil chiffré',
    description:
      'Récupère les données chiffrées du patient connecté (clé maître, salt, profil)',
  })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Patient non trouvé' })
  async getMe(@Req() req: AuthRequest) {
    const userId = req.user.id;
    const patient = await this.patientsService.getByUserIdOrFail(userId);

    // On renvoie uniquement les blobs chiffrés, pas les infos internes
    return {
      encryptedMasterKey: patient.encryptedMasterKey,
      salt: patient.salt,
      encryptedProfile: patient.encryptedProfile,
    };
  }

  /**
   * PATCH /patients/me - Mettre à jour mon profil chiffré
   * 
   * Permet au patient de mettre à jour ses blobs chiffrés.
   * Typiquement utilisé quand le patient modifie son profil médical.
   * 
   * Workflow client :
   * 1. Récupérer les blobs actuels avec GET /patients/me
   * 2. Déchiffrer localement
   * 3. Modifier les données
   * 4. Rechiffrer
   * 5. Envoyer les nouveaux blobs avec PATCH /patients/me
   * 
   * Le backend ne voit que des blobs opaques, jamais les données en clair.
   * 
   * @param req - Requête HTTP avec req.user
   * @param dto - Nouveaux blobs chiffrés (mise à jour partielle possible)
   * @returns Les blobs mis à jour
   */
  @Patch('me')
  @ApiOperation({
    summary: 'Mettre à jour mon profil chiffré',
    description:
      'Met à jour le profil chiffré du patient connecté. Toutes les données doivent être déjà chiffrées côté client.',
  })
  @ApiResponse({ status: 200, description: 'Profil mis à jour avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Patient non trouvé' })
  async updateMe(
    @Req() req: AuthRequest,
    @Body() dto: UpdateEncryptedProfileDto,
  ) {
    const userId = req.user.id;
    const updated = await this.patientsService.updateEncryptedData(userId, dto);

    return {
      encryptedMasterKey: updated.encryptedMasterKey,
      salt: updated.salt,
      encryptedProfile: updated.encryptedProfile,
    };
  }
}
