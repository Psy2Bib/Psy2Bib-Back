import { IsEmail, IsString, MinLength } from 'class-validator'; // Import des décorateurs de validation
import { ApiProperty } from '@nestjs/swagger'; // Import du décorateur Swagger pour la documentation

export class LoginDto {
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
  passwordHash: string; // Mot de passe hashé de l'utilisateur
}
