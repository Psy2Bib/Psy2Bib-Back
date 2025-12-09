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

// WebSocketGateway pour la visio, avec un namespace dédié "visio"
// CORS ouvert pour le moment (à restreindre en production)
@WebSocketGateway({
  cors: {
    origin: '*', // TODO: Restreindre en prod
  },
  namespace: 'visio',
})
@UseGuards(WsJwtGuard) // Protection JWT de chaque message (via WebSocket Guard)
export class VisioGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server; // Instance Socket.IO disponible dans toute la classe

  private readonly logger = new Logger(VisioGateway.name);

  constructor(private readonly appointmentsService: AppointmentsService) {}

  // Callback appelée lorsqu’un client se connecte
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Le JWT est validé par le guard avant même l’arrivée au handler
  }

  // Callback appelée lorsqu’un client se déconnecte
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Un client rejoint la "room" d’un rendez-vous.
   * C’est ce qui permet ensuite l’échange de messages WebRTC dans un espace isolé.
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { appointmentId: string },
  ) {
    // Récupération du user injecté par le WsJwtGuard
    const user = (client as unknown as AuthenticatedSocket).user;
    if (!user) {
      throw new WsException('Unauthorized');
    }

    // Vérification que le rendez-vous existe
    const appointment = await this.appointmentsService.getAppointmentById(
      data.appointmentId,
    );
    if (!appointment) {
      throw new WsException('Appointment not found');
    }

    // Vérification que l'utilisateur est bien un des participants (patient ou psy)
    if (appointment.patient.id !== user.id && appointment.psy.id !== user.id) {
      this.logger.warn(
        `User ${user.id} tried to join room ${data.appointmentId} but is not allowed`,
      );
      throw new WsException('Forbidden: You are not part of this appointment');
    }

    // Le client rejoint la room (Socket.IO)
    await client.join(data.appointmentId);
    this.logger.log(
      `Client ${client.id} (User ${user.id}) joined room ${data.appointmentId}`,
    );

    // On avertit les autres clients de la room qu’un nouvel utilisateur est présent
    client.to(data.appointmentId).emit('userJoined', { userId: user.id });

    return { event: 'joinedRoom', data: data.appointmentId };
  }

  /**
   * Le handler WebRTC principal.
   * Les clients s’échangent leurs signaux via le serveur,
   * qui joue ici le rôle de médiateur (signaling server).
   */
  @SubscribeMessage('signal')
  handleSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; signal: any },
  ) {
    // Vérifier que le client a bien rejoint la room avant d’émettre dedans
    const rooms = Array.from(client.rooms);
    if (!rooms.includes(data.room)) {
      throw new WsException('You are not in this room');
    }

    this.logger.log(`Signal received in room ${data.room} from ${client.id}`);

    // Relais du signal à tous les autres membres de la room
    client.to(data.room).emit('signal', {
      senderId: client.id,
      signal: data.signal, // Contient ICE candidate / SDP, etc.
    });
  }
}
