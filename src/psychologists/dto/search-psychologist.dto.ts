import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchPsychologistDto {
  @ApiPropertyOptional({ description: 'Recherche par nom ou prénom' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filtrer par spécialité (ex: TCC)' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: 'Filtrer par langue (ex: Français)' })
  @IsOptional()
  @IsString()
  language?: string;
}
