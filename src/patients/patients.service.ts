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
   * Récupère le patient (blobs chiffrés) à partir de l'id utilisateur.
   */
  findByUserId(userId: string) {
    return this.patientsRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  /**
   * Version plus "API" : renvoie une erreur si pas trouvé.
   */
  async getByUserIdOrFail(userId: string): Promise<Patient> {
    const patient = await this.findByUserId(userId);
    if (!patient) {
      throw new NotFoundException('Patient not found for this user');
    }
    return patient;
  }

  /**
   * Met à jour les blobs chiffrés (profil, masterKey, salt).
   * On ne touche jamais à des données en clair ici.
   */
  async updateEncryptedData(
    userId: string,
    dto: UpdateEncryptedProfileDto,
  ): Promise<Patient> {
    const patient = await this.getByUserIdOrFail(userId);

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
