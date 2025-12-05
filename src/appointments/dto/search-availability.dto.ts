import { IsOptional, IsUUID, IsISO8601, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchAvailabilityDto {
  /**
   * Filtrer sur un psy particulier
   */
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID du psychologue',
  })
  @IsOptional()
  @IsUUID()
  psyId?: string;

  /**
   * Date/heure de début de la fenêtre de recherche
   */
  @ApiPropertyOptional({
    example: '2025-12-01T00:00:00Z',
    description: 'Date/heure de début (format ISO 8601)',
  })
  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  /**
   * Date/heure de fin de la fenêtre de recherche
   */
  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59Z',
    description: 'Date/heure de fin (format ISO 8601)',
  })
  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  /**
   * Par défaut : true => ne renvoyer que les créneaux non réservés
   */
  @ApiPropertyOptional({
    example: true,
    description: 'Ne renvoyer que les créneaux disponibles (par défaut: true)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  onlyAvailable?: boolean = true;
}
