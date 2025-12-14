import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Appointment,
  AppointmentStatus,
} from '../entities/appointment.entity';

@Injectable()
export class UpdateAppointmentStatusJob {
  private readonly logger = new Logger(UpdateAppointmentStatusJob.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  /**
   * Job exécuté toutes les 5 minutes :
   * - CONFIRMED/PENDING -> IN_PROGRESS si now ∈ [start,end]
   * - IN_PROGRESS -> DONE si now > end
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleStatusUpdates() {
    const now = new Date();

    // Passage en IN_PROGRESS
    await this.appointmentRepo
      .createQueryBuilder()
      .update(Appointment)
      .set({ status: AppointmentStatus.IN_PROGRESS })
      .where('status IN (:...statuses)', {
        statuses: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
      })
      .andWhere('scheduledStart <= :now', { now })
      .andWhere('scheduledEnd >= :now', { now })
      .execute();

    // Passage en DONE
    await this.appointmentRepo
      .createQueryBuilder()
      .update(Appointment)
      .set({ status: AppointmentStatus.DONE })
      .where('status = :status', { status: AppointmentStatus.IN_PROGRESS })
      .andWhere('scheduledEnd < :now', { now })
      .execute();

    this.logger.debug('Appointment statuses updated');
  }
}
