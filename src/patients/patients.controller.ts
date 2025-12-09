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

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('patients')
@ApiBearerAuth('JWT-auth')
@Controller('patients')
@UseGuards(JwtAuthGuard) // Toute la route est protégée par un JWT
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * GET /patients/me
   * Récupère les données chiffrées du patient actuellement connecté.
   * Le JWT contient l'ID utilisateur → on récupère le patient associé.
   *
   * Renvoie uniquement :
   * - encryptedMasterKey
   * - salt
   * - encryptedProfile
   *
   * Aucun déchiffrement n’est effectué ici (Zero Knowledge).
   */
  @Get('me')
  @ApiOperation({
    summary: 'Récupérer mon profil chiffré',
    description:
      'Retourne les données chiffrées du patient connecté (clé maître, salt, profil).',
  })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Patient non trouvé' })
  async getMe(@Req() req: AuthRequest) {
    const userId = req.user.id;

    // Extraction des données patient + erreur si non trouvé
    const patient = await this.patientsService.getByUserIdOrFail(userId);

    // On renvoie UNIQUEMENT les blobs chiffrés
    return {
      encryptedMasterKey: patient.encryptedMasterKey,
      salt: patient.salt,
      encryptedProfile: patient.encryptedProfile,
    };
  }

  /**
   * PATCH /patients/me
   * Met à jour les données chiffrées du patient connecté.
   *
   * IMPORTANT :
   * - Le backend N'A JAMAIS accès à des données en clair.
   * - Tout doit être pré-chiffré côté client (AES-GCM ou autre).
   * - Le DTO peut contenir n’importe quel blob chiffré à remplacer.
   *
   * Exemples d’utilisations :
   * - mise à jour du dossier médical chiffré
   * - rotation de clé maître (nouveau encryptedMasterKey + nouveau salt)
   * - simple édition de profil crypté
   */
  @Patch('me')
  @ApiOperation({
    summary: 'Mettre à jour mon profil chiffré',
    description:
      'Met à jour les données chiffrées du patient connecté. Les données doivent déjà être chiffrées côté client.',
  })
  @ApiResponse({ status: 200, description: 'Profil mis à jour avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Patient non trouvé' })
  async updateMe(
    @Req() req: AuthRequest,
    @Body() dto: UpdateEncryptedProfileDto,
  ) {
    const userId = req.user.id;

    // Le service applique strictement l’update sans jamais toucher au contenu
    const updated = await this.patientsService.updateEncryptedData(userId, dto);

    // On renvoie les blobs mis à jour
    return {
      encryptedMasterKey: updated.encryptedMasterKey,
      salt: updated.salt,
      encryptedProfile: updated.encryptedProfile,
    };
  }
}
