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
    private readonly profileRepo: Repository<PsychologistProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async updateProfile(userId: string, dto: UpdatePsychologistProfileDto) {
    let profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      // Création si n'existe pas
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      profile = this.profileRepo.create({ user, ...dto });
    } else {
      // Mise à jour
      Object.assign(profile, dto);
    }

    return this.profileRepo.save(profile);
  }

  async getProfile(userId: string) {
    const profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async search(query: SearchPsychologistDto) {
    const qb = this.profileRepo
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.isVisible = :isVisible', { isVisible: true });

    if (query.name) {
      qb.andWhere('(user.firstName ILIKE :name OR user.lastName ILIKE :name)', {
        name: `%${query.name}%`,
      });
    }

    if (query.specialty) {
      // simple-array stocke "val1,val2"
      qb.andWhere('profile.specialties LIKE :specialty', {
        specialty: `%${query.specialty}%`,
      });
    }

    if (query.language) {
      qb.andWhere('profile.languages LIKE :language', {
        language: `%${query.language}%`,
      });
    }

    return qb.getMany();
  }
}
