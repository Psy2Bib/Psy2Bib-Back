import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEncryptedProfileDto {
  /**
   * Nouveau profil patient chiffré envoyé par le front.
   * Il s'agit généralement d'une string JSON contenant :
   * - l’IV (initialization vector)
   * - le ciphertext AES-GCM
   * - éventuellement d’autres métadonnées nécessaires au déchiffrement
   *
   * Ce champ est optionnel : le patient peut choisir de ne mettre à jour
   * que sa master key ou son salt sans modifier son profil chiffré.
   */
  @ApiPropertyOptional({
    example: 'encryptedProfile123',
    description: 'Nouveau profil patient chiffré',
  })
  @IsOptional()
  @IsString()
  encryptedProfile?: string;

  /**
   * Nouvelle master key chiffrée côté client.
   * Le front recochiffre cette clé dans deux cas :
   *  - changement de mot de passe
   *  - rotation volontaire de la clé
   *
   * Le serveur ne connaît jamais la clé déchiffrée → Zero Knowledge.
   */
  @ApiPropertyOptional({
    example: 'encryptedMasterKey123',
    description: 'Nouvelle clé maître chiffrée',
  })
  @IsOptional()
  @IsString()
  encryptedMasterKey?: string;

  /**
   * Nouveau salt à utiliser pour dériver la clé locale côté client.
   * Généralement modifié lorsque le mot de passe change.
   *
   * Le serveur stocke seulement ce salt, il ne dérive aucune clé
   * (tout se fait en local dans l'app).
   */
  @ApiPropertyOptional({
    example: 'salt123',
    description: 'Nouveau salt de dérivation',
  })
  @IsOptional()
  @IsString()
  salt?: string;
}
