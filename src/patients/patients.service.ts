/**
 * Service de gestion des patients
 * 
 * Ce service gère les opérations CRUD sur les dossiers patients chiffrés.
 * Il ne manipule que des blobs chiffrés, jamais de données en clair.
 * 
 * @module patients
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { User } from '../users/user.entity';
import { UpdateEncryptedProfileDto } from './dto/update-encrypted-profile.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepo: Repository<Patient>,
  ) {}

  /**
   * Crée un nouveau dossier patient pour un utilisateur
   * 
   * Appelé lors de l'inscription d'un nouveau patient.
   * Stocke les trois blobs Zero-Knowledge fournis par le client.
   * 
   * @param user - L'utilisateur auquel associer ce dossier
   * @param data - Les blobs chiffrés (masterKey, salt, profile)
   * @returns Le dossier patient créé
   */
  createForUser(
    user: User,
    data: {
      encryptedMasterKey: string;
      salt: string;
      encryptedProfile: string;
    },
  ) {
    const patient = this.patientsRepo.create({
      user,
      encryptedMasterKey: data.encryptedMasterKey,
      salt: data.salt,
      encryptedProfile: data.encryptedProfile,
    });
    return this.patientsRepo.save(patient);
  }

  /**
   * Trouve un patient par son user ID
   * 
   * Retourne null si non trouvé (utile pour les vérifications).
   * 
   * @param userId - ID de l'utilisateur
   * @returns Le patient ou null
   */
  findByUserId(userId: string) {
    return this.patientsRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  /**
   * Récupère un patient ou lance une erreur
   * 
   * Version stricte de findByUserId qui lance NotFoundException
   * si le patient n'existe pas. Utilisée dans les endpoints API.
   * 
   * @param userId - ID de l'utilisateur
   * @returns Le patient
   * @throws NotFoundException si non trouvé
   */
  async getByUserIdOrFail(userId: string): Promise<Patient> {
    const patient = await this.findByUserId(userId);
    if (!patient) {
      throw new NotFoundException('Patient not found for this user');
    }
    return patient;
  }

  /**
   * Met à jour les blobs chiffrés d'un patient
   * 
   * Permet au patient de mettre à jour son profil chiffré,
   * sa clé maîtresse, ou son sel. Toutes les données arrivent
   * déjà chiffrées du client.
   * 
   * Le backend ne fait que du stockage de blobs opaques.
   * 
   * @param userId - ID de l'utilisateur
   * @param dto - Nouveaux blobs chiffrés (partiels)
   * @returns Le patient mis à jour
   */
  async updateEncryptedData(
    userId: string,
    dto: UpdateEncryptedProfileDto,
  ): Promise<Patient> {
    const patient = await this.getByUserIdOrFail(userId);

    // Mise à jour partielle : seulement les champs fournis
    if (dto.encryptedProfile !== undefined) {
      patient.encryptedProfile = dto.encryptedProfile;
    }

    if (dto.encryptedMasterKey !== undefined) {
      patient.encryptedMasterKey = dto.encryptedMasterKey;
    }

    if (dto.salt !== undefined) {
      patient.salt = dto.salt;
    }

    return this.patientsRepo.save(patient);
  }
}
