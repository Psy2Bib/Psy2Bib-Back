import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Availability } from './entities/availability.entity';
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
} from './entities/appointment.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { SearchAvailabilityDto } from './dto/search-availability.dto';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { randomUUID } from 'crypto';
import { User } from '../users/user.entity';

type AuthUser = { id: string; role: string };

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepo: Repository<Availability>,

    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    private readonly dataSource: DataSource,
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
   * Utilitaire: transforme "HH:mm" en minutes depuis 00:00
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
   * Construit un Date à partir d'une date (YYYY-MM-DD) et d'un nombre de minutes.
   * Ici on ne force pas "Z" pour éviter d'imposer UTC.
   * À adapter selon la stratégie timezone globale du projet.
   */
  private buildDateFromDayAndMinutes(day: string, minutes: number): Date {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');

    // Interprété par Node comme date locale du serveur
    return new Date(`${day}T${h}:${m}:00`);
  }

  /**
   * Un PSY déclare une plage de disponibilité, transformée en slots de 60 minutes.
   * Exemple:
   *  date: "2025-12-01", startTime: "09:00", endTime: "11:00"
   *  => [09:00-10:00], [10:00-11:00]
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

    // Vérifier s'il existe déjà des créneaux qui se chevauchent pour ce psy
    const dayStart = this.buildDateFromDayAndMinutes(dto.date, startMinutes);
    const dayEnd = this.buildDateFromDayAndMinutes(dto.date, endMinutes);

    const overlapping = await this.availabilityRepo
      .createQueryBuilder('a')
      .leftJoin('a.psy', 'psy')
      .where('psy.id = :psyId', { psyId: psy.id })
      .andWhere(
        'a.start < :dayEnd AND a.end > :dayStart', // condition de chevauchement
        { dayStart, dayEnd },
      )
      .getCount();

    if (overlapping > 0) {
      throw new ConflictException(
        'Some slots already exist or overlap with this range',
      );
    }

    const slots: Availability[] = [];

    console.log(`Creating availabilities for Psy ${psy.id} on ${dto.date} from ${dto.startTime} to ${dto.endTime}`);

    for (let t = startMinutes; t < endMinutes; t += 60) {
      const slotStart = this.buildDateFromDayAndMinutes(dto.date, t);
      const slotEnd = this.buildDateFromDayAndMinutes(dto.date, t + 60);
      
      console.log(` -> Slot: ${slotStart.toISOString()} - ${slotEnd.toISOString()}`);

      const availability = this.availabilityRepo.create({
        psy: { id: psy.id } as User,
        start: slotStart,
        end: slotEnd,
        isBooked: false,
      });

      slots.push(availability);
    }

    const saved = await this.availabilityRepo.save(slots);
    console.log(`Saved ${saved.length} slots.`);
    return saved;
  }

  /**
   * Récupérer les créneaux d'un psy (par son id)
   * Utilisé pour: GET /psy/:id/availabilities
   */
  async getAvailabilitiesForPsy(psyId: string): Promise<Availability[]> {
    return this.availabilityRepo.find({
      where: { psy: { id: psyId } as User },
      order: { start: 'ASC' },
      relations: ['psy'],
    });
  }

  /**
   * Recherche de créneaux disponibles (ou tous, si onlyAvailable=false)
   * Filtrage possible par psyId, dateFrom, dateTo.
   */
  async searchAvailabilities(
    dto: SearchAvailabilityDto,
  ): Promise<Availability[]> {
    const qb = this.availabilityRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.psy', 'psy');

    if (dto.onlyAvailable !== false) {
      qb.andWhere('a.isBooked = :isBooked', { isBooked: false });
    }

    if (dto.psyId) {
      qb.andWhere('psy.id = :psyId', { psyId: dto.psyId });
    }

    if (dto.dateFrom) {
      qb.andWhere('a.start >= :dateFrom', { dateFrom: dto.dateFrom });
    }

    if (dto.dateTo) {
      qb.andWhere('a.end <= :dateTo', { dateTo: dto.dateTo });
    }

    qb.orderBy('a.start', 'ASC');

    return qb.getMany();
  }

  /**
   * Réservation atomique d'un créneau par un PATIENT.
   */
  async bookAppointment(
    patient: AuthUser,
    dto: BookAppointmentDto,
  ): Promise<Appointment> {
    this.ensurePatientRole(patient);

    return this.dataSource.transaction(async (manager) => {
      try {
        // 1. Verrouiller le créneau (SANS jointure pour éviter l'erreur Postgres 0A000 avec FOR UPDATE)
        const availability = await manager.findOne(Availability, {
          where: { id: dto.availabilityId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!availability) {
          throw new NotFoundException('Availability not found');
        }

        // 2. Charger le Psy associé (nécessaire pour créer le RDV)
        // On utilise le repository normal car pas besoin de lock sur le user
        const psy = await manager.findOne(User, {
          where: { id: availability.psy?.id || (availability as any).psyId },
        });
        
        if (!psy) {
           // Fallback si le lazy loading ou psyId n'est pas dispo directement
           // On recharge la relation explicitement
           const availWithPsy = await manager.findOne(Availability, {
             where: { id: availability.id },
             relations: ['psy']
           });
           if (!availWithPsy?.psy) throw new NotFoundException('Psy not found for this slot');
           availability.psy = availWithPsy.psy;
        } else {
          availability.psy = psy;
        }

        if (availability.isBooked) {
          throw new ConflictException('Slot already booked');
        }

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

        // ⚠️ findOne peut retourner null → on gère explicitement pour respecter Promise<Appointment>
        const result = await manager.findOne(Appointment, {
          where: { id: saved.id },
          relations: ['psy', 'patient', 'availability'],
        });

        if (!result) {
          throw new NotFoundException('Appointment not found after save');
        }

        return result;
      } catch (error) {
        console.error('Error in bookAppointment transaction:', error);
        throw error;
      }
    });
  }

  /**
   * Rendez-vous d'un patient connecté
   * Utilisé par: GET /appointments/my
   */
  async getAppointmentsForPatient(patient: AuthUser): Promise<Appointment[]> {
    this.ensurePatientRole(patient);

    return this.appointmentRepo.find({
      where: {
        patient: { id: patient.id } as User,
      },
      relations: ['psy', 'availability'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Rendez-vous d'un psy connecté
   * Utilisé par: GET /psy/appointments
   */
  async getAppointmentsForPsy(psy: AuthUser): Promise<Appointment[]> {
    this.ensurePsyRole(psy);

    return this.appointmentRepo.find({
      where: {
        psy: { id: psy.id } as User,
      },
      relations: ['patient', 'availability'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Annule un rendez-vous et libère le slot
   */
  async cancelAppointment(
    user: AuthUser,
    appointmentId: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'psy', 'availability'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const isPsy = user.role === 'PSY' && appointment.psy.id === user.id;
    const isPatient =
      user.role === 'PATIENT' && appointment.patient.id === user.id;

    if (!isPsy && !isPatient && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'You are not allowed to cancel this appointment',
      );
    }

    appointment.status = AppointmentStatus.CANCELLED;

    if (appointment.availability) {
      appointment.availability.isBooked = false;
      await this.availabilityRepo.save(appointment.availability);
    }

    return this.appointmentRepo.save(appointment);
  }

  /**
   * Récupère un RDV par son ID (usage interne / inter-module)
   */
  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    return this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'psy'],
    });
  }
}
