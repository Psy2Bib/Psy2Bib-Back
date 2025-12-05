import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PsychologistsService } from './psychologists.service';
import { UpdatePsychologistProfileDto } from './dto/update-psychologist-profile.dto';
import { SearchPsychologistDto } from './dto/search-psychologist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

@ApiTags('psychologists')
@Controller('psychologists')
export class PsychologistsController {
  constructor(private readonly psychologistsService: PsychologistsService) {}

  @Get()
  @ApiOperation({
    summary: 'Rechercher des psychologues',
    description: 'Recherche publique par nom, spécialité, langue',
  })
  @ApiResponse({ status: 200, description: 'Liste des profils trouvés' })
  async search(@Query() query: SearchPsychologistDto) {
    return this.psychologistsService.search(query);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mettre à jour mon profil public (PSY)',
    description:
      'Crée ou met à jour le profil public (spécialités, langues, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async updateMyProfile(
    @Req() req: AuthRequest,
    @Body() dto: UpdatePsychologistProfileDto,
  ) {
    return this.psychologistsService.updateProfile(req.user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer mon profil public',
    description: 'Récupère le profil public du psychologue connecté',
  })
  async getMyProfile(@Req() req: AuthRequest) {
    return this.psychologistsService.getProfile(req.user.id);
  }
}
