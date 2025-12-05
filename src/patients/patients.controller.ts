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
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * Récupère les blobs chiffrés du patient connecté.
   * (encryptedMasterKey, salt, encryptedProfile)
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

    // On renvoie seulement les blobs chiffrés + éventuellement des infos utiles
    return {
      encryptedMasterKey: patient.encryptedMasterKey,
      salt: patient.salt,
      encryptedProfile: patient.encryptedProfile,
    };
  }

  /**
   * Met à jour le profil chiffré (et éventuellement la masterKey/salt).
   * Tout est déjà chiffré côté client.
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
