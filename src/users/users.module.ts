import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Module({
  // On importe le repository TypeORM pour l'entité User
  imports: [TypeOrmModule.forFeature([User])],

  // Service injectable pour gérer les utilisateurs (CRUD, auth, etc.)
  providers: [UsersService],

  // On exporte le service pour qu'il soit utilisé dans d'autres modules
  exports: [UsersService],
})
export class UsersModule {}
