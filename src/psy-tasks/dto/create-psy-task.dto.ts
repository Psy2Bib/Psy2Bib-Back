import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PsyTaskType } from '../entities/psy-task.entity';

export class CreatePsyTaskDto {
  @ApiProperty({ example: '2025-12-01' })
  @IsString()
  date: string; // YYYY-MM-DD

  @ApiProperty({ example: 'Compte rendu séance 14h' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Notes privées...', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: '14:00', required: false })
  @IsOptional()
  @IsString()
  time?: string; // HH:mm

  @ApiProperty({ enum: PsyTaskType, example: PsyTaskType.ADMIN })
  @IsEnum(PsyTaskType)
  taskType: PsyTaskType;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
