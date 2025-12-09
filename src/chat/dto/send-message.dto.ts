import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: "ID de l'utilisateur destinataire" }) // Documentation Swagger pour l'ID du destinataire
  @IsUUID()
  recipientId: string;

  @ApiProperty({ description: 'Contenu chiffré (Base64)' })// Documentation Swagger pour le contenu chiffré
  @IsString()
  encryptedContent: string;

  @ApiProperty({ description: "Vecteur d'initialisation (Base64)" })// Documentation Swagger pour le vecteur d'initialisation
  @IsString()
  iv: string;
}
