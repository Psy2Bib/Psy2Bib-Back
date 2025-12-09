import { IsString, IsOptional, IsArray, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO permettant la mise à jour partielle d’un profil psychologue.
 * Tous les champs sont optionnels (PATCH).
 */
export class UpdatePsychologistProfileDto {
  
  /** Titre professionnel affiché (ex : "Psychologue clinicien diplômé"). */
  @ApiPropertyOptional({ example: 'Psychologue Clinicien' })
  @IsOptional()
  @IsString()
  title?: string;

  /** Description professionnelle du psychologue. */
  @ApiPropertyOptional({ example: 'Spécialisé dans les troubles anxieux...' })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Spécialités traitées.
   * Tableau de strings (ex: ["Anxiété", "Dépression"]).
   */
  @ApiPropertyOptional({ example: ['Anxiété', 'Dépression'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  /**
   * Langues parlées par le psychologue.
   * Tableau de strings.
   */
  @ApiPropertyOptional({ example: ['Français', 'Anglais'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  /** Indique si le profil est visible sur la plateforme. */
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  /** Tarif horaire en euros. */
  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;
}
