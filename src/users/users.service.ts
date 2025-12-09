import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    // Injection du repository TypeORM pour l'entité User
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  // Recherche un utilisateur par email (sans récupérer le passwordHash)
  findByEmail(email: string) {
    return this.usersRepo.findOne({
      where: { email },
    });
  }

  // Recherche un utilisateur par email avec sélection explicite du mot de passe
  // Utile pour la vérification des identifiants au moment du login
  findByEmailWithPassword(email: string) {
    return this.usersRepo.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'passwordHash',      // obligatoire pour la comparaison des mots de passe
        'role',
        'refreshTokenHash',
        'firstName',
        'lastName',
      ],
    });
  }

  // Recherche un utilisateur par son ID
  findById(id: string) {
    return this.usersRepo.findOne({
      where: { id },
    });
  }

  // Crée un nouvel utilisateur à partir d'un Partial<User>
  // TypeORM gère automatiquement l'instanciation et la sauvegarde
  create(userData: Partial<User>) {
    const user = this.usersRepo.create(userData);
    return this.usersRepo.save(user);
  }

  // Met à jour le hash du refreshToken (utile pour les sessions)
  // Peut aussi être mis à null pour invalider un refresh token
  async updateRefreshTokenHash(userId: string, hash: string | null) {
    await this.usersRepo.update(userId, { refreshTokenHash: hash });
  }
}
