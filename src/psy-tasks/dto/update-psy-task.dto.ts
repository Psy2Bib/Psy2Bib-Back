import { PartialType } from '@nestjs/swagger';
import { CreatePsyTaskDto } from './create-psy-task.dto';

export class UpdatePsyTaskDto extends PartialType(CreatePsyTaskDto) {}
