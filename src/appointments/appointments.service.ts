import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'; // Import des exceptions NestJS
import { InjectRepository } from '@nestjs/typeorm'; // Décorateur pour injecter les repositories TypeORM
import { Repository, DataSource } from 'typeorm'; // Repository et DataSource pour les transactions
import { Availability } from './entities/availability.entity'; // Entité Availability
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
} from './entities/appointment.entity'; // Entité Appointment + enums
import { CreateAvailabilityDto } from './dto/create-availability.dto'; // DTO création disponibilité
import { SearchAvailabilityDto } from './dto/search-availability.dto'; // DTO recherche disponibilité
import { BookAppointmentDto } from './dto/book-appointment.dto'; // DTO réservation rendez-vous
import { randomUUID } from 'crypto'; // Pour générer meetingId pour les rendez-vous en ligne
import { User } from '../users/user.entity'; // Entité User

type AuthUser = { id: string; role: string }; // Type simplifié pour l'utilisateur connecté

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepo: Repository<Availability>, // Repository Availability

    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>, // Repository Appointment

    private readonly dataSource: DataSource, // DataSource pour gérer les transactions
  ) {}

  /**
   * Vérifie que l'utilisateur connecté est bien un PSY
   */
  ensurePsyRole(user: AuthUser) {
    if (user.role !== 'PSY') {
      throw new ForbiddenException('Only PSY can perform this action');
    }
  }

  /**
   * Vérifie que l'utilisateur connecté est bien un PATIENT
   */
  ensurePatientRole(user: AuthUser) {
    if (user.role !== 'PATIENT') {
      throw new ForbiddenException('Only PATIENT can perform this action');
    }
  }

  /**
   * Transforme "HH:mm" en minutes depuis 00:00
   */
  private parseTimeToMinutes(time: string): number {
    const [h, m] = time.split(':').map((t) => parseInt(t, 10));

    if (
      Number.isNaN(h) ||
      Number.isNaN(m) ||
      h < 0 ||
      h > 23 ||
      m < 0 ||
      m > 59
    ) {
      throw new BadRequestException(`Invalid time: ${time}`);
    }

    return h * 60 + m;
  }

  /**
   * Construit un Date à partir d'une date et d'un nombre de minutes
   */
  private buildDateFromDayAndMinutes(day: string, minutes: number): Date {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');

    return new Date(`${day}T${h}:${m}:00`);
  }

  /**
   * Crée des créneaux de disponibilité pour un PSY
   */
  async createAvailabilitiesForPsy(
    psy: AuthUser,
    dto: CreateAvailabilityDto,
  ): Promise<Availability[]> {
    this.ensurePsyRole(psy);

    const startMinutes = this.parseTimeToMinutes(dto.startTime);
    const endMinutes = this.parseTimeToMinutes(dto.endTime);

    if (endMinutes <= startMinutes) {
      throw new BadRequestException('endTime must be after startTime');
    }

    const duration = endMinutes - startMinutes;
    if (duration % 60 !== 0) {
      throw new BadRequestException(
        'Time range must be a multiple of 60 minutes',
      );
    }

    // Vérifier les créneaux existants qui se chevauchent
    const dayStart = this.buildDateFromDayAndMinutes(dto.date, startMinutes);
    const dayEnd = this.buildDateFromDayAndMinutes(dto.date, endMinutes);

    const overlapping = await this.availabilityRepo
      .createQueryBuilder('a')
      .leftJoin('a.psy', 'psy')
      .where('psy.id = :psyId', { psyId: psy.id })
      .andWhere('a.start < :dayEnd AND a.end > :dayStart', { dayStart, dayEnd })
      .getCount();

    if (overlapping > 0) {
      throw new ConflictException(
        'Some slots already exist or overlap with this range',
      );
    }

    const slots: Availability[] = [];

    // Création des créneaux par tranche de 60 minutes
    for (let t = startMinutes; t < endMinutes; t += 60) {
      const slotStart = this.buildDateFromDayAndMinutes(dto.date, t);
      const slotEnd = this.buildDateFromDayAndMinutes(dto.date, t + 60);

      const availability = this.availabilityRepo.create({
        psy: { id: psy.id } as User,
        start: slotStart,
        end: slotEnd,
        isBooked: false,
      });

      slots.push(availability);
    }

    const saved = await this.availabilityRepo.save(slots);
    return saved;
  }

  /**
   * Récupère tous les créneaux d'un PSY
   */
  async getAvailabilitiesForPsy(psyId: string): Promise<Availability[]> {
    return this.availabilityRepo.find({
      where: { psy: { id: psyId } as User },
      order: { start: 'ASC' },
      relations: ['psy'],
    });
  }

  /**
   * Recherche des créneaux avec filtres optionnels
   */
  async searchAvailabilities(dto: SearchAvailabilityDto): Promise<Availability[]> {
    const qb = this.availabilityRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.psy', 'psy');

    if (dto.onlyAvailable !== false) {
      qb.andWhere('a.isBooked = :isBooked', { isBooked: false });
    }

    if (dto.psyId) qb.andWhere('psy.id = :psyId', { psyId: dto.psyId });
    if (dto.dateFrom) qb.andWhere('a.start >= :dateFrom', { dateFrom: dto.dateFrom });
    if (dto.dateTo) qb.andWhere('a.end <= :dateTo', { dateTo: dto.dateTo });

    qb.orderBy('a.start', 'ASC');

    return qb.getMany();
  }

  /**
   * Réservation atomique d'un créneau par un PATIENT
   */
  async bookAppointment(patient: AuthUser, dto: BookAppointmentDto): Promise<Appointment> {
    this.ensurePatientRole(patient);

    return this.dataSource.transaction(async (manager) => {
      const availability = await manager.findOne(Availability, {
        where: { id: dto.availabilityId },
        lock: { mode: 'pessimistic_write' }, // Verrouillage du slot pour éviter les doubles réservations
      });

      if (!availability) throw new NotFoundException('Availability not found');

      // Charger le psy associé
      const psy = await manager.findOne(User, { where: { id: availability.psy?.id || (availability as any).psyId } });
      availability.psy = psy || availability.psy;

      if (availability.isBooked) throw new ConflictException('Slot already booked');

      const appointment = manager.create(Appointment, {
        psy: availability.psy,
        patient: { id: patient.id } as User,
        availability,
        type: dto.type,
        status: AppointmentStatus.CONFIRMED,
        meetingId: dto.type === AppointmentType.ONLINE ? randomUUID() : null,
      });

      availability.isBooked = true;

      await manager.save(availability);
      const saved = await manager.save(appointment);

      const result = await manager.findOne(Appointment, {
        where: { id: saved.id },
        relations: ['psy', 'patient', 'availability'],
      });

      if (!result) throw new NotFoundException('Appointment not found after save');

      return result;
    });
  }

  /**
   * Rendez-vous d'un patient connecté
   */
  async getAppointmentsForPatient(patient: AuthUser): Promise<Appointment[]> {
    this.ensurePatientRole(patient);

    return this.appointmentRepo.find({
      where: { patient: { id: patient.id } as User },
      relations: ['psy', 'availability'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Rendez-vous d'un psy connecté
   */
  async getAppointmentsForPsy(psy: AuthUser): Promise<Appointment[]> {
    this.ensurePsyRole(psy);

    return this.appointmentRepo.find({
      where: { psy: { id: psy.id } as User },
      relations: ['patient', 'availability'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Annule un rendez-vous et libère le slot
   */
  async cancelAppointment(user: AuthUser, appointmentId: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'psy', 'availability'],
    });

    if (!appointment) throw new NotFoundException('Appointment not found');

    const isPsy = user.role === 'PSY' && appointment.psy.id === user.id;
    const isPatient = user.role === 'PATIENT' && appointment.patient.id === user.id;

    if (!isPsy && !isPatient && user.role !== 'ADMIN') {
      throw new ForbiddenException('You are not allowed to cancel this appointment');
    }

    appointment.status = AppointmentStatus.CANCELLED;

    if (appointment.availability) {
      appointment.availability.isBooked = false;
      await this.availabilityRepo.save(appointment.availability);
    }

    return this.appointmentRepo.save(appointment);
  }

  /**
   * Récupère un RDV par son ID
   */
  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    return this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'psy'],
    });
  }
}
