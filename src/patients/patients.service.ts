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
   * Crée un record Patient associé à un User lors de l'inscription.
   *
   * Toutes les données reçues ici doivent déjà être chiffrées côté client :
   *  - encryptedMasterKey : clé maître chiffrée par le mot de passe (ou clé dérivée)
   *  - salt : salt utilisé pour dériver la clé de chiffrement
   *  - encryptedProfile : profil patient entièrement chiffré (dossier médical)
   *
   * Le backend ne manipule jamais de données en clair (zero-knowledge).
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

    // Enregistrement en base du profil patient chiffré
    return this.patientsRepo.save(patient);
  }

  /**
   * Récupère un patient via l'id utilisateur.
   * Utilisé par les endpoints sécurisés.
   *
   * Retourne null si non trouvé.
   */
  findByUserId(userId: string) {
    return this.patientsRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'], // récupère l'objet user pour vérifier l'association
    });
  }

  /**
   * Variante stricte :
   * - renvoie l’entité patient
   * - lance une exception 404 si absent
   *
   * Ce comportement est idéal côté API.
   */
  async getByUserIdOrFail(userId: string): Promise<Patient> {
    const patient = await this.findByUserId(userId);
    if (!patient) {
      throw new NotFoundException('Patient not found for this user');
    }
    return patient;
  }

  /**
   * Mise à jour partielle des données chiffrées du patient.
   *
   * ⚠️ Points importants :
   * - Toutes les données doivent être chiffrées côté client.
   * - Le backend ne fait aucun traitement cryptographique.
   * - On met à jour uniquement ce qui est fourni dans le DTO.
   * - Aucun champ de données en clair n'existe dans la DB.
   *
   * Use case typiques :
   * - Le patient change son mot de passe → nouvelle masterKey + nouveau salt.
   * - Le patient met à jour son dossier médical → nouveau encryptedProfile.
   */
  async updateEncryptedData(
    userId: string,
    dto: UpdateEncryptedProfileDto,
  ): Promise<Patient> {
    const patient = await this.getByUserIdOrFail(userId);

    // Mise à jour sélective : on modifie seulement les champs envoyés.
    if (dto.encryptedProfile !== undefined) {
      patient.encryptedProfile = dto.encryptedProfile;
    }

    if (dto.encryptedMasterKey !== undefined) {
      patient.encryptedMasterKey = dto.encryptedMasterKey;
    }

    if (dto.salt !== undefined) {
      patient.salt = dto.salt;
    }

    // Sauvegarde en base des nouveaux blobs chiffrés
    return this.patientsRepo.save(patient);
  }
}
