import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common'; // Import des décorateurs et utilitaires NestJS
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'; // Import des décorateurs Swagger pour documentation
import { AppointmentsService } from './appointments.service'; // Import du service de gestion des rendez-vous
import { CreateAvailabilityDto } from './dto/create-availability.dto'; // DTO pour création de disponibilités
import { SearchAvailabilityDto } from './dto/search-availability.dto'; // DTO pour recherche de disponibilités
import { BookAppointmentDto } from './dto/book-appointment.dto'; // DTO pour réservation de rendez-vous
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Guard pour protéger les routes avec JWT
import type { Request } from 'express'; // Type Express pour Request

// Interface pour enrichir la requête avec les informations de l'utilisateur connecté
interface RequestWithUser extends Request {
  user: {
    id: string;
    role: string;
  };
}

@ApiTags('appointments') // Tag Swagger pour regrouper les routes
@ApiBearerAuth('JWT-auth') // Documentation Swagger pour auth JWT
@Controller()
@UseGuards(JwtAuthGuard) // Toutes les routes nécessitent une authentification JWT
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Un PSY déclare ses disponibilités pour un jour donné,
   * sous forme de plage, qui sera découpée en slots de 30 minutes.
   *
   * POST /psy/availabilities
   */
  @Post('psy/availabilities')
  @ApiOperation({
    summary: 'Créer des disponibilités pour un psychologue',
    description:
      "Déclare les disponibilités d'un psychologue pour un jour donné. Les plages horaires sont automatiquement découpées en créneaux de 30 minutes.",
  })
  @ApiResponse({
    status: 201,
    description: 'Disponibilités créées avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({
    status: 403,
    description: 'Seuls les psychologues peuvent créer des disponibilités',
  })
  async createPsyAvailabilities(
    @Req() req: RequestWithUser,
    @Body() dto: CreateAvailabilityDto,
  ) {
    const user = req.user; // Récupération de l'utilisateur connecté
    const slots = await this.appointmentsService.createAvailabilitiesForPsy(
      user,
      dto,
    ); // Création des créneaux via le service

    return {
      psyId: user.id,
      count: slots.length,
      slots,
    };
  }

  /**
   * Récupère tous les créneaux (réservés ou non) d'un psy donné
   *
   * GET /psy/:id/availabilities
   */
  @Get('psy/:id/availabilities')
  @ApiOperation({
    summary: "Récupérer les disponibilités d'un psychologue",
    description:
      "Récupère tous les créneaux (réservés ou non) d'un psychologue donné",
  })
  @ApiParam({
    name: 'id',
    description: 'ID du psychologue',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des créneaux récupérée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Psychologue non trouvé' })
  async getPsyAvailabilities(@Param('id') psyId: string) {
    const slots = await this.appointmentsService.getAvailabilitiesForPsy(psyId);
    return { psyId, slots };
  }

  /**
   * Recherche des créneaux disponibles (ou non)
   *
   * GET /search/availabilities?psyId=...&dateFrom=...&dateTo=...&onlyAvailable=true
   */
  @Get('search/availabilities')
  @ApiOperation({
    summary: 'Rechercher des créneaux disponibles',
    description:
      'Recherche des créneaux disponibles avec des filtres optionnels (psychologue, dates, disponibilité)',
  })
  @ApiResponse({ status: 200, description: 'Recherche effectuée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async searchAvailabilities(@Query() query: SearchAvailabilityDto) {
    const slots = await this.appointmentsService.searchAvailabilities(query);
    return { count: slots.length, slots };
  }

  /**
   * Un PATIENT réserve un créneau
   *
   * POST /appointments/book
   */
  @Post('appointments/book')
  @ApiOperation({
    summary: 'Réserver un créneau',
    description: 'Permet à un patient de réserver un créneau de disponibilité',
  })
  @ApiResponse({ status: 201, description: 'Rendez-vous réservé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({
    status: 403,
    description: 'Seuls les patients peuvent réserver des créneaux',
  })
  @ApiResponse({ status: 404, description: 'Créneau non trouvé' })
  @ApiResponse({ status: 409, description: 'Créneau déjà réservé' })
  async bookAppointment(
    @Req() req: RequestWithUser,
    @Body() dto: BookAppointmentDto,
  ) {
    const user = req.user;
    const appointment = await this.appointmentsService.bookAppointment(
      user,
      dto,
    ); // Réservation via le service

    return {
      message: 'Appointment booked successfully',
      appointment,
    };
  }

  /**
   * Récupère les rendez-vous du PATIENT connecté
   *
   * GET /appointments/my
   */
  @Get('appointments/my')
  @ApiOperation({
    summary: 'Récupérer mes rendez-vous (patient)',
    description: 'Récupère tous les rendez-vous du patient connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des rendez-vous récupérée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getMyAppointments(@Req() req: RequestWithUser) {
    const user = req.user;
    const appointments =
      await this.appointmentsService.getAppointmentsForPatient(user);

    return {
      count: appointments.length,
      appointments,
    };
  }

  /**
   * Récupère les rendez-vous du PSY connecté
   *
   * GET /psy/appointments
   */
  @Get('psy/appointments')
  @ApiOperation({
    summary: 'Récupérer mes rendez-vous (psychologue)',
    description: 'Récupère tous les rendez-vous du psychologue connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des rendez-vous récupérée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getPsyAppointments(@Req() req: RequestWithUser) {
    const user = req.user;
    const appointments =
      await this.appointmentsService.getAppointmentsForPsy(user);

    return {
      count: appointments.length,
      appointments,
    };
  }

  /**
   * Annule un rendez-vous (Patient ou Psy)
   *
   * PATCH /appointments/:id/cancel
   */
  @Patch('appointments/:id/cancel')
  @ApiOperation({
    summary: 'Annuler un rendez-vous',
    description:
      "Permet d'annuler un rendez-vous existant. Accessible au patient ou au psychologue concerné.",
  })
  @ApiParam({
    name: 'id',
    description: 'ID du rendez-vous',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Rendez-vous annulé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({
    status: 403,
    description: "Vous n'avez pas le droit d'annuler ce rendez-vous",
  })
  @ApiResponse({ status: 404, description: 'Rendez-vous non trouvé' })
  async cancelAppointment(
    @Req() req: RequestWithUser,
    @Param('id') appointmentId: string,
  ) {
    const user = req.user;
    const appointment = await this.appointmentsService.cancelAppointment(
      user,
      appointmentId,
    );

    return {
      message: 'Appointment cancelled successfully',
      appointment,
    };
  }
}
