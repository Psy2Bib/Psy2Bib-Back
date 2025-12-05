import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { VisioGateway } from './visio/visio.gateway';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [AppointmentsModule, JwtModule, ConfigModule],
  providers: [VisioGateway],
})
export class VisioModule {}
