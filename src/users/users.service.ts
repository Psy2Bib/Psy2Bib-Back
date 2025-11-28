import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepo.findOne({
      where: { email },
    });
  }

  findByEmailWithPassword(email: string) {
    return this.usersRepo.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'passwordHash',
        'role',
        'refreshTokenHash',
        'firstName',
        'lastName',
      ],
    });
  }


  findById(id: string) {
    return this.usersRepo.findOne({
      where: { id },
    });
  }


  create(userData: Partial<User>) {
    const user = this.usersRepo.create(userData);
    return this.usersRepo.save(user);
  }


  async updateRefreshTokenHash(userId: string, hash: string | null) {
    await this.usersRepo.update(userId, { refreshTokenHash: hash });
  }
}
