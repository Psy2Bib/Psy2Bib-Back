/**
 * DTO pour la mise à jour des données chiffrées d'un patient
 * 
 * Permet de mettre à jour partiellement les blobs chiffrés.
 * Tous les champs sont optionnels pour permettre des mises à jour ciblées.
 * 
 * @module patients/dto
 */

import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO UpdateEncryptedProfileDto
 * 
 * Utilisé pour PATCH /patients/me
 * Permet de mettre à jour un ou plusieurs blobs chiffrés sans avoir à tout renvoyer.
 */
export class UpdateEncryptedProfileDto {
  /**
   * Nouveau profil patient chiffré
   * 
   * Format typique : JSON chiffré contenant { iv, ciphertext, tag }
   * Le client chiffre les données médicales et envoie le blob résultant.
   * 
   * Cas d'usage :
   * - Modification des antécédents médicaux
   * - Ajout de notes personnelles
   * - Mise à jour du profil santé
   */
  @ApiPropertyOptional({
    example: 'encryptedProfile123',
    description: 'Nouveau profil patient chiffré',
  })
  @IsOptional()
  @IsString()
  encryptedProfile?: string;

  /**
   * Nouvelle clé maîtresse chiffrée
   * 
   * Rare, mais nécessaire si :
   * - L'utilisateur change son mot de passe
   * - Rotation des clés de sécurité
   * - Migration vers un nouvel algorithme de chiffrement
   * 
   * Dans ce cas, il faut :
   * 1. Déchiffrer les données avec l'ancienne clé
   * 2. Générer une nouvelle clé maîtresse
   * 3. Rechiffrer tout avec la nouvelle clé
   * 4. Chiffrer la nouvelle clé maîtresse avec le nouveau mot de passe
   * 5. Envoyer les nouveaux blobs
   */
  @ApiPropertyOptional({
    example: 'encryptedMasterKey123',
    description: 'Nouvelle clé maître chiffrée',
  })
  @IsOptional()
  @IsString()
  encryptedMasterKey?: string;

  /**
   * Nouveau sel de dérivation
   * 
   * Changé en même temps que la clé maîtresse, notamment lors
   * d'un changement de mot de passe.
   * 
   * Le sel doit être généré aléatoirement et être unique.
   */
  @ApiPropertyOptional({
    example: 'salt123',
    description: 'Nouveau salt de dérivation',
  })
  @IsOptional()
  @IsString()
  salt?: string;
}
