import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator'; // Import des décorateurs de validation
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // Import pour documentation Swagger
import { UserRole } from '../../users/user.entity'; // Enum des rôles utilisateur

export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: "Adresse email de l'utilisateur",
  })
  @IsEmail() // Validation : doit être une adresse email valide
  email: string; // Email de l'utilisateur

  @ApiProperty({
    example: 'hashedPassword123',
    description: 'Hash du mot de passe (minimum 8 caractères)',
  })
  @IsString() // Validation : doit être une chaîne de caractères
  @MinLength(8) // Validation : longueur minimale de 8 caractères
  passwordHash: string; // Mot de passe hashé

  @ApiProperty({ example: 'John', description: "Prénom de l'utilisateur" })
  @IsString()
  firstName: string; // Prénom de l'utilisateur

  @ApiProperty({ example: 'Doe', description: "Nom de l'utilisateur" })
  @IsString()
  lastName: string; // Nom de famille de l'utilisateur

  @ApiProperty({
    example: 'encryptedMasterKey123',
    description: 'Clé maître chiffrée',
  })
  @IsString()
  encryptedMasterKey: string; // Clé maître chiffrée pour la sécurité des patients

  @ApiProperty({ example: 'salt123', description: 'Salt pour le chiffrement' })
  @IsString()
  salt: string; // Salt utilisé pour dériver les clés de chiffrement

  @ApiProperty({
    example: 'encryptedProfile123',
    description: 'Profil utilisateur chiffré',
  })
  @IsString()
  encryptedProfile: string; // Profil chiffré de l'utilisateur

  @ApiPropertyOptional({
    enum: UserRole,
    description: "Rôle de l'utilisateur (PSY ou PATIENT)",
  })
  @IsOptional() // Champ optionnel
  @IsEnum(UserRole) // Doit être une valeur valide de l'enum UserRole
  role?: UserRole; // Rôle de l'utilisateur
}
