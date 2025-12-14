/**
 * Entité PsychologistProfile - Profil public des psychologues
 * 
 * Cette entité stocke les informations publiques des psychologues qui apparaissent
 * dans la recherche de l'application. Contrairement aux données patients qui sont
 * chiffrées, ces informations sont en clair car elles doivent être cherchables.
 * 
 * @module psychologists
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

/**
 * Entité PsychologistProfile
 * 
 * Profil professionnel public d'un psychologue.
 * Contient toutes les infos nécessaires pour que les patients puissent
 * choisir un psychologue adapté à leurs besoins.
 */
@Entity('psychologist_profiles')
export class PsychologistProfile {
  /**
   * ID unique du profil
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Relation OneToOne avec User
   * 
   * Un profil psychologue = un utilisateur avec role PSY
   * onDelete: CASCADE => Si le compte utilisateur est supprimé, le profil l'est aussi
   */
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  /**
   * Titre professionnel
   * 
   * Exemples : "Psychologue Clinicien", "Psychothérapeute",
   * "Neuropsychologue", "Psychologue du travail"
   * 
   * Permet aux patients de comprendre rapidement la spécialisation.
   */
  @Column({ type: 'text', nullable: true })
  title: string;

  /**
   * Description / Biographie
   * 
   * Texte libre où le psychologue se présente :
   * - Parcours professionnel
   * - Approche thérapeutique
   * - Types de problématiques traitées
   * - Philosophie de travail
   * 
   * C'est souvent le premier élément que les patients lisent pour se faire une idée.
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Numéro ADELI
   * 
   * Identifiant unique attribué par les ARS (Agences Régionales de Santé).
   * Obligatoire pour exercer en France comme psychologue.
   * 
   * Format : 9 chiffres + 2 lettres (ex: "123456789AB")
   * 
   * Contraintes :
   * - Unique : un numéro ADELI = un psychologue
   * - Nullable : le psy peut choisir de ne pas l'afficher publiquement
   * 
   * Utilité : Permet aux patients de vérifier la légitimité du praticien
   */
  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  adeli: string | null;

  /**
   * Prénom du psychologue
   * 
   * Stocké séparément du User pour permettre un affichage personnalisé
   * dans le profil public (certains préfèrent un nom d'usage différent).
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string | null;

  /**
   * Nom de famille du psychologue
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  /**
   * Spécialités / Domaines d'expertise
   * 
   * Liste de spécialités thérapeutiques :
   * - "TCC" (Thérapie Cognitivo-Comportementale)
   * - "Psychanalyse"
   * - "Anxiété"
   * - "Dépression"
   * - "Troubles alimentaires"
   * - "Couple et famille"
   * - etc.
   * 
   * Format : simple-array => stocké comme "val1,val2,val3" en base
   * Permet la recherche et le filtrage par spécialité.
   */
  @Column('simple-array', { nullable: true })
  specialties: string[];

  /**
   * Ville d'exercice
   * 
   * Utile pour la recherche géolocalisée.
   * Pour les consultations en présentiel, les patients cherchent souvent
   * un psychologue proche de chez eux.
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  city: string | null;

  /**
   * Adresse complète du cabinet
   * 
   * Nécessaire pour les consultations en présentiel.
   * Peut être laissé vide si le psychologue fait uniquement de la téléconsultation.
   * 
   * Format libre : "12 rue de la Paix, 75000 Paris"
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  /**
   * Langues parlées
   * 
   * Liste des langues dans lesquelles le psychologue peut consulter.
   * Important pour les patients non-francophones ou bilingues.
   * 
   * Exemples : ["Français", "Anglais", "Espagnol", "Arabe"]
   * 
   * Format : simple-array => "Français,Anglais,Espagnol"
   */
  @Column('simple-array', { nullable: true })
  languages: string[];

  /**
   * Visibilité dans la recherche
   * 
   * Permet au psychologue de contrôler s'il apparaît dans les résultats de recherche.
   * 
   * Cas d'usage :
   * - false : Profil en cours de complétion, pas encore prêt
   * - false : Agenda plein, ne prend plus de nouveaux patients temporairement
   * - false : Pause professionnelle (congés, formation)
   * - true : Disponible et cherche activement de nouveaux patients
   * 
   * Par défaut : true
   */
  @Column({ type: 'boolean', default: true })
  isVisible: boolean;

  /**
   * Tarif horaire en euros
   * 
   * Prix d'une séance (généralement 45-60 minutes).
   * Permet aux patients de filtrer selon leur budget.
   * 
   * En France, les tarifs classiques sont entre 40€ et 100€/séance.
   * 
   * Nullable : le psy peut choisir de ne pas afficher publiquement son tarif
   * et préfère en discuter en privé.
   */
  @Column({ type: 'int', nullable: true })
  hourlyRate: number;

  /**
   * Date de dernière modification
   * 
   * Mise à jour automatiquement à chaque modification du profil.
   * Utile pour :
   * - Afficher les "nouveaux profils" ou "profils récemment mis à jour"
   * - Détecter les profils abandonnés/inactifs
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
