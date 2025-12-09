import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchPsychologistDto {
  @ApiPropertyOptional({ description: 'Recherche par nom ou prénom' })// Documentation Swagger pour le nom
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filtrer par spécialité (ex: TCC)' })// Documentation Swagger pour la spécialité
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: 'Filtrer par langue (ex: Français)' })// Documentation Swagger pour la langue
  @IsOptional()
  @IsString()
  language?: string;
}
