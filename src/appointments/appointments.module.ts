import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Availability } from './entities/availability.entity';
import { Appointment } from './entities/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Availability, Appointment])],
  providers: [AppointmentsService],
  controllers: [AppointmentsController],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
