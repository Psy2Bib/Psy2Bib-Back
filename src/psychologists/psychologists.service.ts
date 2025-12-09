import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PsychologistProfile } from './entities/psychologist-profile.entity';
import { User } from '../users/user.entity';
import { UpdatePsychologistProfileDto } from './dto/update-psychologist-profile.dto';
import { SearchPsychologistDto } from './dto/search-psychologist.dto';

@Injectable()
export class PsychologistsService {
  constructor(
    @InjectRepository(PsychologistProfile)
    private readonly profileRepo: Repository<PsychologistProfile>, // Repo pour accéder aux profils psy
    @InjectRepository(User)
    private readonly userRepo: Repository<User>, // Repo pour accéder aux utilisateurs
  ) {}

  /**
   * Crée ou met à jour le profil public d'un psychologue.
   * Si le profil n'existe pas, il est créé automatiquement.
   */
  async updateProfile(userId: string, dto: UpdatePsychologistProfileDto) {
    let profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      // Création du profil si inexistant
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      profile = this.profileRepo.create({ user, ...dto });
    } else {
      // Mise à jour du profil existant avec les nouvelles données
      Object.assign(profile, dto);
    }

    // Sauvegarde en base et renvoi du profil
    return this.profileRepo.save(profile);
  }

  /**
   * Récupère le profil public d'un psychologue via son userId.
   * Lance une exception si le profil n'existe pas.
   */
  async getProfile(userId: string) {
    const profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'], // jointure pour récupérer les infos de l'utilisateur
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  /**
   * Recherche des psychologues visibles selon filtres optionnels.
   * - name : recherche par prénom ou nom
   * - specialty : recherche par spécialité
   * - language : recherche par langue
   */
  async search(query: SearchPsychologistDto) {
    const qb = this.profileRepo
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user') // jointure avec l'utilisateur
      .where('profile.isVisible = :isVisible', { isVisible: true }); // uniquement les profils publics

    if (query.name) {
      // Filtre par prénom ou nom (insensible à la casse)
      qb.andWhere('(user.firstName ILIKE :name OR user.lastName ILIKE :name)', {
        name: `%${query.name}%`,
      });
    }

    if (query.specialty) {
      // Filtre par spécialité (simple-array stocké comme "val1,val2")
      qb.andWhere('profile.specialties LIKE :specialty', {
        specialty: `%${query.specialty}%`,
      });
    }

    if (query.language) {
      // Filtre par langue (simple-array)
      qb.andWhere('profile.languages LIKE :language', {
        language: `%${query.language}%`,
      });
    }

    // Exécution de la requête et retour des profils correspondants
    return qb.getMany();
  }
}
