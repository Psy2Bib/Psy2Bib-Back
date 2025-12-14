/**
 * Entité PsyTask - Tâches et notes privées des psychologues
 * 
 * Permet aux psychologues de gérer leurs tâches personnelles :
 * rendez-vous, comptes-rendus, tâches administratives, etc.
 * 
 * Ces tâches sont privées et n'apparaissent que dans l'agenda du psychologue.
 * Elles ne sont PAS visibles par les patients.
 * 
 * @module psy-tasks
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

/**
 * Type de tâche psychologue
 * 
 * Catégorisation pour filtrer et colorer les tâches dans l'agenda.
 */
export enum PsyTaskType {
  RDV = 'rdv',                     // Rendez-vous (rappel, préparation)
  COMPTE_RENDU = 'compte-rendu',   // Rédaction de compte-rendu patient
  ADMIN = 'admin',                 // Tâche administrative (facturation, dossiers)
  AUTRE = 'autre',                 // Autre type de tâche
}

/**
 * Entité PsyTask
 * 
 * Représente une tâche ou note personnelle du psychologue.
 * Utilisée pour la gestion de l'agenda et du suivi patient.
 */
@Entity('psy_tasks')
export class PsyTask {
  /**
   * ID unique de la tâche
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Psychologue propriétaire de la tâche
   * 
   * ManyToOne car un psy peut avoir de nombreuses tâches.
   * onDelete: CASCADE => Si le psy est supprimé, ses tâches aussi.
   * 
   * Les tâches sont strictement privées, aucun patient ne peut les voir.
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  psy: User;

  /**
   * Date de la tâche
   * 
   * Format: YYYY-MM-DD (string)
   * Permet d'afficher les tâches dans le calendrier par jour.
   * 
   * Exemples : "2025-12-15", "2025-01-20"
   */
  @Column({ type: 'varchar', length: 20 })
  date: string;

  /**
   * Titre de la tâche
   * 
   * Description courte affichée dans l'agenda.
   * 
   * Exemples :
   * - "Rédiger compte-rendu M. Dupont"
   * - "Préparer séance TCC"
   * - "Facturation mensuelle"
   */
  @Column({ type: 'varchar', length: 255 })
  title: string;

  /**
   * Notes détaillées (optionnel)
   * 
   * Champ texte libre pour des notes complémentaires.
   * Peut contenir :
   * - Détails de la tâche
   * - Observations cliniques
   * - Rappels personnels
   * 
   * null si pas de notes.
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /**
   * Heure de la tâche (optionnel)
   * 
   * Format : HH:mm (ex: "14:30", "09:00")
   * 
   * null pour les tâches "toute la journée" sans heure précise.
   * Défini pour les tâches planifiées à un moment spécifique.
   */
  @Column({ type: 'varchar', length: 10, nullable: true })
  time: string | null;

  /**
   * Type de tâche
   * 
   * Permet de catégoriser et filtrer les tâches.
   * Chaque type peut avoir une couleur différente dans l'interface.
   * 
   * Par défaut : AUTRE
   */
  @Column({
    type: 'enum',
    enum: PsyTaskType,
    default: PsyTaskType.AUTRE,
  })
  taskType: PsyTaskType;

  /**
   * Statut de complétion
   * 
   * false = Tâche en cours / à faire
   * true = Tâche terminée
   * 
   * Permet d'afficher des checkboxes et filtrer les tâches complétées.
   */
  @Column({ type: 'boolean', default: false })
  completed: boolean;

  /**
   * Date de création de la tâche
   */
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /**
   * Date de dernière modification
   * 
   * Mise à jour lors de l'édition ou du changement de statut.
   */
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
