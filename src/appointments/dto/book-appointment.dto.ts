import { IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentType } from '../entities/appointment.entity';

// DTO utilisé pour réserver un rendez-vous
export class BookAppointmentDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID du créneau de disponibilité',
  })
  @IsUUID() // Vérifie que availabilityId est un UUID valide
  availabilityId: string;

  @ApiProperty({
    enum: AppointmentType,
    example: AppointmentType.ONLINE,
    description: 'Type de rendez-vous',
  })
  @IsEnum(AppointmentType) // Vérifie que le type correspond à une valeur valide de l’énumération AppointmentType
  type: AppointmentType;
}
