import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/user.entity';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: "Token d'accès JWT",
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token de rafraîchissement JWT',
  })
  refreshToken: string;

  @ApiPropertyOptional({
    example: 'encryptedMasterKey123',
    description: 'Clé maître chiffrée (pour les patients)',
  })
  encryptedMasterKey?: string | null;

  @ApiPropertyOptional({
    example: 'salt123',
    description: 'Salt de dérivation (pour les patients)',
  })
  salt?: string | null;

  @ApiPropertyOptional({
    example: 'encryptedProfile123',
    description: 'Profil chiffré (pour les patients)',
  })
  encryptedProfile?: string | null;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: "ID de l'utilisateur",
  })
  userId: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.PATIENT,
    description: "Rôle de l'utilisateur",
  })
  role: UserRole;
}
