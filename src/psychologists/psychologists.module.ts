import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PsychologistsController } from './psychologists.controller';
import { PsychologistsService } from './psychologists.service';
import { PsychologistProfile } from './entities/psychologist-profile.entity';
import { User } from '../users/user.entity';

@Module({
  // Import des entités TypeORM utilisées dans ce module
  imports: [TypeOrmModule.forFeature([PsychologistProfile, User])],

  // Déclaration des controllers exposés par ce module
  controllers: [PsychologistsController],

  // Déclaration des services (providers) disponibles dans ce module
  providers: [PsychologistsService],

  // Export des services pour qu'ils puissent être utilisés par d'autres modules
  exports: [PsychologistsService],
})
export class PsychologistsModule {}
