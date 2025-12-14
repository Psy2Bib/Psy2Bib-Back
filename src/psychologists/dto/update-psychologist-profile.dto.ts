/**
 * DTO pour la mise à jour d'un profil psychologue
 * 
 * Tous les champs sont optionnels pour permettre des mises à jour partielles.
 * Le psychologue peut ne modifier qu'un seul champ sans avoir à tout renvoyer.
 * 
 * @module psychologists/dto
 */

import { IsString, IsOptional, IsArray, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO UpdatePsychologistProfileDto
 * 
 * Structure pour PUT /psychologists/me
 * Permet de créer ou mettre à jour le profil public d'un psychologue.
 */
export class UpdatePsychologistProfileDto {
  /**
   * Numéro ADELI
   * Identifiant professionnel français obligatoire pour exercer
   */
  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  adeli?: string;

  /**
   * Prénom du psychologue
   */
  @ApiPropertyOptional({ example: 'Sophie' })
  @IsOptional()
  @IsString()
  firstName?: string;

  /**
   * Nom de famille
   */
  @ApiPropertyOptional({ example: 'Martin' })
  @IsOptional()
  @IsString()
  lastName?: string;

  /**
   * Ville d'exercice
   * Utile pour la recherche géolocalisée
   */
  @ApiPropertyOptional({ example: 'Paris' })
  @IsOptional()
  @IsString()
  city?: string;

  /**
   * Adresse complète du cabinet
   * Pour les consultations en présentiel
   */
  @ApiPropertyOptional({ example: '12 rue de la Paix, 75000 Paris' })
  @IsOptional()
  @IsString()
  address?: string;

  /**
   * Titre professionnel
   * Ex: "Psychologue Clinicien", "Psychothérapeute"
   */
  @ApiPropertyOptional({ example: 'Psychologue Clinicien' })
  @IsOptional()
  @IsString()
  title?: string;

  /**
   * Description / Biographie
   * Présentation libre du psychologue et de son approche
   */
  @ApiPropertyOptional({ example: 'Spécialisé dans les troubles anxieux...' })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Spécialités thérapeutiques
   * Liste de domaines d'expertise
   * Ex: ["TCC", "Anxiété", "Dépression", "Troubles alimentaires"]
   */
  @ApiPropertyOptional({ example: ['Anxiété', 'Dépression'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  /**
   * Langues parlées
   * Important pour les patients non-francophones
   */
  @ApiPropertyOptional({ example: ['Français', 'Anglais'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  /**
   * Visibilité dans la recherche
   * true = apparaît dans les résultats
   * false = profil masqué (utile si agenda complet temporairement)
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  /**
   * Tarif horaire en euros
   * Prix d'une séance (typiquement 45-60 minutes)
   */
  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;
}
