/**
 * DTO pour la connexion
 * 
 * Ce DTO définit les données nécessaires pour qu'un utilisateur se connecte.
 * Contrairement à l'inscription, le login ne nécessite que l'email et le hash du mot de passe.
 * 
 * @module auth/dto
 */

import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Classe LoginDto - Données de connexion
 * 
 * Simple et direct : juste ce qu'il faut pour authentifier un utilisateur.
 * Le backend comparera le hash reçu avec celui stocké en base.
 */
export class LoginDto {
  /**
   * Adresse email de l'utilisateur
   * 
   * Utilisée comme identifiant unique pour retrouver le compte.
   */
  @ApiProperty({
    example: 'john.doe@example.com',
    description: "Adresse email de l'utilisateur",
  })
  @IsEmail()
  email: string;

  /**
   * Hash du mot de passe
   * 
   * Doit être le MÊME hash que celui envoyé lors de l'inscription.
   * Le frontend doit utiliser exactement le même algorithme et les mêmes paramètres.
   * 
   * Exemple de workflow frontend :
   * 1. Utilisateur tape son mot de passe
   * 2. Frontend applique le même processus qu'à l'inscription (hash avec salt, etc.)
   * 3. Frontend envoie le hash au backend
   * 4. Backend compare hash_reçu === hash_stocké
   */
  @ApiProperty({
    example: 'hashedPassword123',
    description: 'Hash du mot de passe (minimum 8 caractères)',
  })
  @IsString()
  @MinLength(8)
  passwordHash: string;
}
