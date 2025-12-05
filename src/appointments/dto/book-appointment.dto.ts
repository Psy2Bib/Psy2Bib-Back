import { IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentType } from '../entities/appointment.entity';

export class BookAppointmentDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID du créneau de disponibilité',
  })
  @IsUUID()
  availabilityId: string;

  @ApiProperty({
    enum: AppointmentType,
    example: AppointmentType.ONLINE,
    description: 'Type de rendez-vous',
  })
  @IsEnum(AppointmentType)
  type: AppointmentType;
}
