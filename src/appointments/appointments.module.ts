import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Availability } from './entities/availability.entity';
import { Appointment } from './entities/appointment.entity';
import { UpdateAppointmentStatusJob } from './jobs/update-appointment-status.job';

@Module({
  imports: [TypeOrmModule.forFeature([Availability, Appointment])],
  providers: [AppointmentsService, UpdateAppointmentStatusJob],
  controllers: [AppointmentsController],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
