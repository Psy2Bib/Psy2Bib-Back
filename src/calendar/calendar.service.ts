import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from '../appointments/entities/availability.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../users/user.entity';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepo: Repository<Availability>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getPsyCalendar(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== 'PSY') {
      throw new ForbiddenException('Only PSY can access this resource');
    }

    const availabilities = await this.availabilityRepo.find({
      where: { psy: { id: userId } },
      order: { start: 'ASC' },
      relations: ['psy', 'appointment'],
    });

    const appointments = await this.appointmentRepo.find({
      where: { psy: { id: userId } },
      order: { scheduledStart: 'ASC' },
      relations: ['psy', 'patient', 'availability'],
    });

    return { availabilities, appointments };
  }

  async getPatientCalendar(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== 'PATIENT') {
      throw new ForbiddenException('Only PATIENT can access this resource');
    }

    const appointments = await this.appointmentRepo.find({
      where: { patient: { id: userId } },
      order: { scheduledStart: 'ASC' },
      relations: ['psy', 'patient', 'availability'],
    });

    return { appointments };
  }
}
