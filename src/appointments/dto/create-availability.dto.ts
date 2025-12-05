import { IsISO8601, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAvailabilityDto {
  /**
   * Jour de disponibilité (date uniquement)
   * Exemple: "2025-12-01"
   */
  @ApiProperty({
    example: '2025-12-01',
    description: 'Jour de disponibilité (format ISO 8601)',
  })
  @IsISO8601()
  date: string;

  /**
   * Heure de début (format HH:mm, ex "09:00")
   */
  @ApiProperty({
    example: '09:00',
    description: 'Heure de début (format HH:mm)',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime must be in format HH:mm',
  })
  startTime: string;

  /**
   * Heure de fin (format HH:mm, ex "12:00")
   */
  @ApiProperty({ example: '12:00', description: 'Heure de fin (format HH:mm)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'endTime must be in format HH:mm',
  })
  endTime: string;
}
