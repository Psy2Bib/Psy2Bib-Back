import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // Import des décorateurs Swagger pour documentation
import { UserRole } from '../../users/user.entity'; // Enum des rôles utilisateur

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: "Token d'accès JWT",
  })
  accessToken: string; // Token JWT utilisé pour l'accès aux routes protégées

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token de rafraîchissement JWT',
  })
  refreshToken: string; // Token JWT utilisé pour rafraîchir le token d'accès

  @ApiPropertyOptional({
    example: 'encryptedMasterKey123',
    description: 'Clé maître chiffrée (pour les patients)',
  })
  encryptedMasterKey?: string | null; // Clé chiffrée spécifique aux patients, optionnelle

  @ApiPropertyOptional({
    example: 'salt123',
    description: 'Salt de dérivation (pour les patients)',
  })
  salt?: string | null; // Salt utilisé pour dériver des clés (optionnel, patient)

  @ApiPropertyOptional({
    example: 'encryptedProfile123',
    description: 'Profil chiffré (pour les patients)',
  })
  encryptedProfile?: string | null; // Profil utilisateur chiffré (optionnel, patient)

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: "ID de l'utilisateur",
  })
  userId: string; // Identifiant unique de l'utilisateur

  @ApiProperty({
    enum: UserRole,
    example: UserRole.PATIENT,
    description: "Rôle de l'utilisateur",
  })
  role: UserRole; // Rôle de l'utilisateur (PATIENT, PSY, ADMIN...)
}
