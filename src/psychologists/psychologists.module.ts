import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PsychologistsController } from './psychologists.controller';
import { PsychologistsService } from './psychologists.service';
import { PsychologistProfile } from './entities/psychologist-profile.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PsychologistProfile, User])],
  controllers: [PsychologistsController],
  providers: [PsychologistsService],
  exports: [PsychologistsService],
})
export class PsychologistsModule {}
