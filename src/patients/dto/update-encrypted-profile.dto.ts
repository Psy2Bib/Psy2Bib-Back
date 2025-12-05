import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEncryptedProfileDto {
  /**
   * Nouveau profil patient chiffré (JSON string contenant iv + ciphertext, etc.)
   * Obligatoire si on veut mettre à jour le profil.
   */
  @ApiPropertyOptional({
    example: 'encryptedProfile123',
    description: 'Nouveau profil patient chiffré',
  })
  @IsOptional()
  @IsString()
  encryptedProfile?: string;

  /**
   * Nouvelle master key chiffrée (si le mot de passe du user a changé par exemple).
   * Optionnel.
   */
  @ApiPropertyOptional({
    example: 'encryptedMasterKey123',
    description: 'Nouvelle clé maître chiffrée',
  })
  @IsOptional()
  @IsString()
  encryptedMasterKey?: string;

  /**
   * Nouveau salt de dérivation (si changement de mot de passe).
   * Optionnel.
   */
  @ApiPropertyOptional({
    example: 'salt123',
    description: 'Nouveau salt de dérivation',
  })
  @IsOptional()
  @IsString()
  salt?: string;
}
