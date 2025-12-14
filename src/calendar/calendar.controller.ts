import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { id: string; role: string };
}

@ApiTags('calendar')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('psy')
  @ApiOperation({ summary: 'Calendrier psychologue', description: 'Liste les disponibilités et rendez-vous du psychologue connecté' })
  @ApiResponse({ status: 200, description: 'Calendrier récupéré' })
  async getPsyCalendar(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.calendarService.getPsyCalendar(userId);
  }

  @Get('patient')
  @ApiOperation({ summary: 'Calendrier patient', description: 'Liste les rendez-vous du patient connecté' })
  @ApiResponse({ status: 200, description: 'Calendrier récupéré' })
  async getPatientCalendar(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.calendarService.getPatientCalendar(userId);
  }
}
