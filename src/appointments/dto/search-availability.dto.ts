import { IsOptional, IsUUID, IsISO8601, IsBoolean } from 'class-validator'; // Import des décorateurs de validation
import { Type } from 'class-transformer'; // Import pour transformer le type des données
import { ApiPropertyOptional } from '@nestjs/swagger'; // Import pour la documentation Swagger des propriétés optionnelles

export class SearchAvailabilityDto {
  /**
   * Filtrer sur un psy particulier
   */
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID du psychologue', // Documentation Swagger pour l'ID du psychologue
  })
  @IsOptional() // Le champ est optionnel
  @IsUUID() // Validation: s'assure que la valeur est un UUID valide
  psyId?: string; // Propriété optionnelle pour filtrer par psychologue

  /**
   * Date/heure de début de la fenêtre de recherche
   */
  @ApiPropertyOptional({
    example: '2025-12-01T00:00:00Z',
    description: 'Date/heure de début (format ISO 8601)', // Documentation Swagger pour la date de début
  })
  @IsOptional() // Le champ est optionnel
  @IsISO8601() // Validation: s'assure que la valeur est au format ISO 8601
  dateFrom?: string; // Propriété optionnelle pour définir le début de la plage de recherche

  /**
   * Date/heure de fin de la fenêtre de recherche
   */
  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59Z',
    description: 'Date/heure de fin (format ISO 8601)', // Documentation Swagger pour la date de fin
  })
  @IsOptional() // Le champ est optionnel
  @IsISO8601() // Validation: s'assure que la valeur est au format ISO 8601
  dateTo?: string; // Propriété optionnelle pour définir la fin de la plage de recherche

  /**
   * Par défaut : true => ne renvoyer que les créneaux non réservés
   */
  @ApiPropertyOptional({
    example: true,
    description: 'Ne renvoyer que les créneaux disponibles (par défaut: true)', // Documentation Swagger pour le filtre de disponibilité
  })
  @IsOptional() // Le champ est optionnel
  @Type(() => Boolean) // Transformation pour s'assurer que la valeur soit interprétée comme un booléen
  @IsBoolean() // Validation: s'assure que la valeur est un booléen
  onlyAvailable?: boolean = true; // Par défaut, ne renvoyer que les créneaux disponibles
}
