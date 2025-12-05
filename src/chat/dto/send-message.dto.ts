import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
