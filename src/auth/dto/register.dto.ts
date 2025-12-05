import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: "Adresse email de l'utilisateur",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'hashedPassword123',
    description: 'Hash du mot de passe (minimum 8 caractères)',
  })
  @IsString()
  @MinLength(8)
  passwordHash: string;

  @ApiProperty({ example: 'John', description: "Prénom de l'utilisateur" })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: "Nom de l'utilisateur" })
  @IsString()
  lastName: string;

  @ApiProperty({
    example: 'encryptedMasterKey123',
    description: 'Clé maître chiffrée',
  })
  @IsString()
  encryptedMasterKey: string;

  @ApiProperty({ example: 'salt123', description: 'Salt pour le chiffrement' })
  @IsString()
  salt: string;

  @ApiProperty({
    example: 'encryptedProfile123',
    description: 'Profil utilisateur chiffré',
  })
  @IsString()
  encryptedProfile: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: "Rôle de l'utilisateur (PSY ou PATIENT)",
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
