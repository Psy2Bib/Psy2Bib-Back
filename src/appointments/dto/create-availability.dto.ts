import { IsISO8601, IsString, Matches } from 'class-validator'; // Import des décorateurs de validation pour les DTOs
import { ApiProperty } from '@nestjs/swagger'; // Import du décorateur pour la documentation Swagger

export class CreateAvailabilityDto {
  /**
   * Jour de disponibilité (date uniquement)
   * Exemple: "2025-12-01"
   */
  @ApiProperty({
    example: '2025-12-01',
    description: 'Jour de disponibilité (format ISO 8601)', // Documentation pour Swagger
  })
  @IsISO8601() // Validation: s'assure que la valeur est au format ISO 8601 (YYYY-MM-DD)
  date: string; // Propriété représentant la date de disponibilité

  /**
   * Heure de début (format HH:mm, ex "09:00")
   */
  @ApiProperty({
    example: '09:00',
    description: 'Heure de début (format HH:mm)', // Documentation Swagger pour l'heure de début
  })
  @IsString() // Validation: s'assure que la valeur est une chaîne de caractères
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime must be in format HH:mm', // Message d'erreur personnalisé si le format n'est pas respecté
  })
  startTime: string; // Propriété représentant l'heure de début de disponibilité

  /**
   * Heure de fin (format HH:mm, ex "12:00")
   */
  @ApiProperty({ example: '12:00', description: 'Heure de fin (format HH:mm)' }) // Documentation Swagger pour l'heure de fin
  @IsString() // Validation: s'assure que la valeur est une chaîne de caractères
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'endTime must be in format HH:mm', // Message d'erreur si le format HH:mm n'est pas respecté
  })
  endTime: string; // Propriété représentant l'heure de fin de disponibilité
}
