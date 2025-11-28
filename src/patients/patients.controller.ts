import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateEncryptedProfileDto } from './dto/update-encrypted-profile.dto';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    sub: string; // userId
    email: string;
    role: string;
  };
}

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * Récupère les blobs chiffrés du patient connecté.
   * (encryptedMasterKey, encryptionSalt, encryptedProfile)
   */
  @Get('me')
  async getMe(@Req() req: AuthRequest) {
    const userId = req.user.sub;
    const patient = await this.patientsService.getByUserIdOrFail(userId);

    // On renvoie seulement les blobs chiffrés + éventuellement des infos utiles
    return {
      encryptedMasterKey: patient.encryptedMasterKey,
      encryptionSalt: patient.encryptionSalt,
      encryptedProfile: patient.encryptedProfile,
    };
  }

  /**
   * Met à jour le profil chiffré (et éventuellement la masterKey/salt).
   * Tout est déjà chiffré côté client.
   */
  @Patch('me')
  async updateMe(
    @Req() req: AuthRequest,
    @Body() dto: UpdateEncryptedProfileDto,
  ) {
    const userId = req.user.sub;
    const updated = await this.patientsService.updateEncryptedData(userId, dto);

    return {
      encryptedMasterKey: updated.encryptedMasterKey,
      encryptionSalt: updated.encryptionSalt,
      encryptedProfile: updated.encryptedProfile,
    };
  }
}
