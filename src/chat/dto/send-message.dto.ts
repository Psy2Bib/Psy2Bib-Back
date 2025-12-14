import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: "ID de l'utilisateur destinataire" })
  @IsUUID()
  recipientId: string;

  @ApiProperty({ description: 'Contenu chiffré (Base64)' })
  @IsString()
  encryptedContent: string;

  @ApiProperty({ description: "Vecteur d'initialisation (Base64)" })
  @IsString()
  iv: string;

  @ApiPropertyOptional({ description: 'Chemin du fichier joint chiffré (si applicable)' })
  @IsOptional()
  @IsString()
  attachmentPath?: string;
}
