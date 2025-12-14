import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PsyTasksService } from './psy-tasks.service';
import { CreatePsyTaskDto } from './dto/create-psy-task.dto';
import { UpdatePsyTaskDto } from './dto/update-psy-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { id: string; role: string };
}

@ApiTags('psy-tasks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('psy-tasks')
export class PsyTasksController {
  constructor(private readonly psyTasksService: PsyTasksService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les tâches du psy connecté' })
  @ApiResponse({ status: 200 })
  async list(@Req() req: RequestWithUser) {
    return this.psyTasksService.listForPsy(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une tâche' })
  @ApiResponse({ status: 201 })
  async create(@Req() req: RequestWithUser, @Body() dto: CreatePsyTaskDto) {
    return this.psyTasksService.createForPsy(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une tâche' })
  @ApiResponse({ status: 200 })
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdatePsyTaskDto,
  ) {
    return this.psyTasksService.updateForPsy(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une tâche' })
  @ApiResponse({ status: 200 })
  async delete(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.psyTasksService.deleteForPsy(req.user.id, id);
  }
}
