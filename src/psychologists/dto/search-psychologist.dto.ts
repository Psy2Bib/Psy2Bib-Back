/**
 * DTO pour la recherche de psychologues
 * 
 * Définit les critères de filtrage possibles lors de la recherche publique.
 * Tous les champs sont optionnels - permet de faire une recherche large
 * ou très ciblée selon les besoins du patient.
 * 
 * @module psychologists/dto
 */

import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO SearchPsychologistDto
 * 
 * Utilisé par GET /psychologists avec query parameters.
 * Les filtres sont combinés avec AND (tous doivent correspondre).
 */
export class SearchPsychologistDto {
  /**
   * Recherche par nom ou pseudo
   * 
   * Recherche partielle insensible à la casse dans le pseudo de l'utilisateur.
   * 
   * @example "mart" trouvera "Martin", "Martine", "SmartPsy"
   */
  @ApiPropertyOptional({ description: 'Recherche par nom ou prénom' })
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * Filtre par spécialité
   * 
   * Recherche partielle dans la liste des spécialités du psychologue.
   * 
   * @example "TCC" trouvera tous les psychologues qui pratiquent la TCC
   * @example "Anxiété" trouvera ceux spécialisés en troubles anxieux
   */
  @ApiPropertyOptional({ description: 'Filtrer par spécialité (ex: TCC)' })
  @IsOptional()
  @IsString()
  specialty?: string;

  /**
   * Filtre par langue parlée
   * 
   * Recherche partielle dans la liste des langues du psychologue.
   * Utile pour les patients non-francophones ou bilingues.
   * 
   * @example "Anglais" trouvera tous les psychologues anglophones
   * @example "Arabe" trouvera ceux parlant arabe
   */
  @ApiPropertyOptional({ description: 'Filtrer par langue (ex: Français)' })
  @IsOptional()
  @IsString()
  language?: string;
}
