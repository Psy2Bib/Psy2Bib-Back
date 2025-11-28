import { IsOptional, IsString } from 'class-validator';

export class UpdateEncryptedProfileDto {
  /**
   * Nouveau profil patient chiffré (JSON string contenant iv + ciphertext, etc.)
   * Obligatoire si on veut mettre à jour le profil.
   */
  @IsOptional()
  @IsString()
  encryptedProfile?: string;

  /**
   * Nouvelle master key chiffrée (si le mot de passe du user a changé par exemple).
   * Optionnel.
   */
  @IsOptional()
  @IsString()
  encryptedMasterKey?: string;

  /**
   * Nouveau salt de dérivation (si changement de mot de passe).
   * Optionnel.
   */
  @IsOptional()
  @IsString()
  encryptionSalt?: string;
}
