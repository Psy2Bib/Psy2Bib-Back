import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PsyTask, PsyTaskType } from './entities/psy-task.entity';
import { User } from '../users/user.entity';
import { CreatePsyTaskDto } from './dto/create-psy-task.dto';
import { UpdatePsyTaskDto } from './dto/update-psy-task.dto';

@Injectable()
export class PsyTasksService {
  constructor(
    @InjectRepository(PsyTask) private readonly tasksRepo: Repository<PsyTask>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  private async assertPsy(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== 'PSY') {
      throw new ForbiddenException('Only PSY can perform this action');
    }
    return user;
  }

  async listForPsy(userId: string) {
    await this.assertPsy(userId);
    return this.tasksRepo.find({
      where: { psy: { id: userId } },
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  async createForPsy(userId: string, dto: CreatePsyTaskDto) {
    const psy = await this.assertPsy(userId);
    const task = this.tasksRepo.create({
      psy,
      title: dto.title,
      notes: dto.notes ?? null,
      date: dto.date,
      time: dto.time ?? null,
      taskType: dto.taskType ?? PsyTaskType.AUTRE,
      completed: dto.completed ?? false,
    });
    return this.tasksRepo.save(task);
  }

  async updateForPsy(userId: string, taskId: string, dto: UpdatePsyTaskDto) {
    await this.assertPsy(userId);
    const task = await this.tasksRepo.findOne({ where: { id: taskId }, relations: ['psy'] });
    if (!task) throw new NotFoundException('Task not found');
    if (task.psy.id !== userId) throw new ForbiddenException();
    Object.assign(task, {
      title: dto.title ?? task.title,
      notes: dto.notes ?? task.notes,
      date: dto.date ?? task.date,
      time: dto.time ?? task.time,
      taskType: dto.taskType ?? task.taskType,
      completed: dto.completed ?? task.completed,
    });
    return this.tasksRepo.save(task);
  }

  async deleteForPsy(userId: string, taskId: string) {
    await this.assertPsy(userId);
    const task = await this.tasksRepo.findOne({ where: { id: taskId }, relations: ['psy'] });
    if (!task) throw new NotFoundException('Task not found');
    if (task.psy.id !== userId) throw new ForbiddenException();
    await this.tasksRepo.remove(task);
    return { deleted: true };
  }
}
