/**
 * Service de gestion des profils psychologues
 * 
 * Ce service gère les opérations CRUD sur les profils publics des psychologues.
 * Il inclut également la logique de recherche multicritères (nom, spécialité, langue).
 * 
 * @module psychologists
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PsychologistProfile } from './entities/psychologist-profile.entity';
import { User } from '../users/user.entity';
import { UpdatePsychologistProfileDto } from './dto/update-psychologist-profile.dto';
import { SearchPsychologistDto } from './dto/search-psychologist.dto';

/**
 * Service PsychologistsService
 * 
 * Fournit les méthodes pour :
 * - Créer/mettre à jour un profil psychologue
 * - Récupérer un profil
 * - Rechercher des psychologues avec filtres
 */
@Injectable()
export class PsychologistsService {
  constructor(
    @InjectRepository(PsychologistProfile)
    private readonly profileRepo: Repository<PsychologistProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Crée ou met à jour un profil psychologue
   * 
   * Cette méthode gère deux cas :
   * 1. Si le profil n'existe pas encore => création
   * 2. Si le profil existe déjà => mise à jour
   * 
   * C'est pratique car le psychologue peut appeler cette méthode sans
   * se soucier de savoir si son profil existe déjà ou non.
   * 
   * Cas d'usage :
   * - Appelé lors de l'inscription d'un PSY (création initiale)
   * - Appelé par PUT /psychologists/me (mise à jour)
   * 
   * @param userId - ID de l'utilisateur psychologue
   * @param dto - Données du profil (partielles autorisées)
   * @returns Le profil créé ou mis à jour
   * @throws NotFoundException si l'utilisateur n'existe pas
   */
  async updateProfile(userId: string, dto: UpdatePsychologistProfileDto) {
    // Recherche du profil existant
    let profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      /**
       * Cas 1 : Création du profil
       * 
       * Le profil n'existe pas encore, on le crée.
       * D'abord, on vérifie que l'utilisateur existe bien.
       */
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      // Création du nouveau profil avec les données fournies
      profile = this.profileRepo.create({ user, ...dto });
    } else {
      /**
       * Cas 2 : Mise à jour du profil existant
       * 
       * Object.assign copie toutes les propriétés du DTO dans le profil.
       * Les champs non fournis gardent leur valeur actuelle.
       */
      Object.assign(profile, dto);
    }

    // Sauvegarde en base (insert ou update selon le cas)
    return this.profileRepo.save(profile);
  }

  /**
   * Récupère le profil d'un psychologue
   * 
   * Utilisé notamment par GET /psychologists/me pour que le psychologue
   * puisse voir et éditer son propre profil.
   * 
   * @param userId - ID de l'utilisateur
   * @returns Le profil avec la relation user chargée
   * @throws NotFoundException si le profil n'existe pas
   */
  async getProfile(userId: string) {
    const profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'], // Charge aussi les infos de l'utilisateur
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  /**
   * Recherche de psychologues avec filtres
   * 
   * Permet aux patients de trouver un psychologue adapté à leurs besoins.
   * Recherche multicritères :
   * - Par nom (pseudo de l'utilisateur)
   * - Par spécialité (TCC, anxiété, etc.)
   * - Par langue parlée
   * 
   * Tous les filtres sont optionnels et combinables avec AND.
   * La recherche est insensible à la casse (ILIKE).
   * 
   * @param query - Critères de recherche
   * @returns Liste des profils correspondants
   * 
   * @example
   * ```typescript
   * // Recherche de psychologues TCC parlant anglais
   * const results = await service.search({
   *   specialty: 'TCC',
   *   language: 'Anglais'
   * });
   * ```
   */
  async search(query: SearchPsychologistDto) {
    /**
     * QueryBuilder pour construire une requête SQL dynamique
     * 
     * On utilise createQueryBuilder plutôt que find() car on a besoin
     * de conditions dynamiques (WHERE conditionnels selon les filtres fournis).
     */
    const qb = this.profileRepo
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user'); // Jointure pour avoir le pseudo
      
    /**
     * Note : Filtre isVisible commenté
     * 
     * Normalement, on devrait filtrer sur isVisible = true pour ne montrer
     * que les profils publics. C'est commenté pour le développement,
     * mais devrait être activé en production :
     * 
     * .where('profile.isVisible = :isVisible', { isVisible: true })
     */

    /**
     * Filtre par nom
     * 
     * Recherche partielle (LIKE) dans le pseudo de l'utilisateur.
     * ILIKE = insensible à la casse (PostgreSQL)
     * 
     * Exemple : "mart" trouve "Martin", "Martine", "SmartPsy"
     */
    if (query.name) {
      qb.andWhere('user.pseudo ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    /**
     * Filtre par spécialité
     * 
     * Les spécialités sont stockées en simple-array : "TCC,Anxiété,Dépression"
     * On utilise LIKE pour chercher une correspondance partielle dans la chaîne.
     * 
     * Exemple : specialty="TCC" trouve les profils contenant "TCC" dans leurs spécialités
     */
    if (query.specialty) {
      qb.andWhere('profile.specialties LIKE :specialty', {
        specialty: `%${query.specialty}%`,
      });
    }

    /**
     * Filtre par langue
     * 
     * Même principe que les spécialités.
     * Les langues sont en simple-array : "Français,Anglais,Espagnol"
     */
    if (query.language) {
      qb.andWhere('profile.languages LIKE :language', {
        language: `%${query.language}%`,
      });
    }

    // Exécution de la requête et retour des résultats
    return qb.getMany();
  }
}
