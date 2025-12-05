import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import {
  WsJwtGuard,
  AuthenticatedSocket,
} from '../../auth/guards/ws-jwt.guard';
import { AppointmentsService } from '../../appointments/appointments.service';

@WebSocketGateway({
  cors: {
    origin: '*', // TODO: Restreindre en prod
  },
  namespace: 'visio',
})
@UseGuards(WsJwtGuard)
export class VisioGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VisioGateway.name);

  constructor(private readonly appointmentsService: AppointmentsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // La vérification JWT se fait via le Guard sur les messages
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { appointmentId: string },
  ) {
    const user = (client as unknown as AuthenticatedSocket).user;
    if (!user) {
      throw new WsException('Unauthorized');
    }

    const appointment = await this.appointmentsService.getAppointmentById(
      data.appointmentId,
    );

    if (!appointment) {
      throw new WsException('Appointment not found');
    }

    // Vérification des droits : l'utilisateur doit être le patient OU le psy du RDV
    if (appointment.patient.id !== user.id && appointment.psy.id !== user.id) {
      this.logger.warn(
        `User ${user.id} tried to join room ${data.appointmentId} but is not allowed`,
      );
      throw new WsException('Forbidden: You are not part of this appointment');
    }

    await client.join(data.appointmentId);
    this.logger.log(
      `Client ${client.id} (User ${user.id}) joined room ${data.appointmentId}`,
    );

    // Notifier les autres qu'un pair est arrivé
    client.to(data.appointmentId).emit('userJoined', { userId: user.id });

    return { event: 'joinedRoom', data: data.appointmentId };
  }

  @SubscribeMessage('signal')
  handleSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; signal: any },
  ) {
    // Vérification : le client doit être membre de la room pour y diffuser
    const rooms = Array.from(client.rooms);
    if (!rooms.includes(data.room)) {
      throw new WsException('You are not in this room');
    }

    this.logger.log(`Signal received in room ${data.room} from ${client.id}`);

    client.to(data.room).emit('signal', {
      senderId: client.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      signal: data.signal,
    });
  }
}
