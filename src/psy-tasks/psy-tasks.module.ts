import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PsyTasksService } from './psy-tasks.service';
import { PsyTasksController } from './psy-tasks.controller';
import { PsyTask } from './entities/psy-task.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PsyTask, User])],
  controllers: [PsyTasksController],
  providers: [PsyTasksService],
  exports: [PsyTasksService],
})
export class PsyTasksModule {}
