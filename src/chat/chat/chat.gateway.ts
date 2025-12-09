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
import { ChatService } from '../chat.service';
import { SendMessageDto } from '../dto/send-message.dto';

@WebSocketGateway({
  cors: { origin: '*' }, // Autorise les connexions depuis n'importe quelle origine
  namespace: 'chat',     // Namespace Socket.IO : /chat
})
@UseGuards(WsJwtGuard) // Applique un guard JWT pour sécuriser la connexion
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server; // Instance du serveur Socket.IO

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  /**
   * Géré automatiquement quand un client se connecte
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client Chat connected: ${client.id}`);
  }

  /**
   * Géré automatiquement quand un client se déconnecte
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client Chat disconnected: ${client.id}`);
  }

  /**
   * Gestion de l'événement "join"
   * Permet à un utilisateur de rejoindre sa room privée pour recevoir ses messages
   */
  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket) {
    const user = (client as unknown as AuthenticatedSocket).user;
    if (!user) throw new WsException('Unauthorized'); // Refuse l'accès si non authentifié

    // L'utilisateur rejoint sa propre room "user:ID"
    void client.join(`user:${user.id}`);
    this.logger.log(`User ${user.id} joined their private chat room`);

    return { event: 'joined', data: `user:${user.id}` };
  }

  /**
   * Gestion de l'événement "sendMessage"
   * - Sauvegarde le message en base via ChatService
   * - Emet le message au destinataire s'il est connecté
   * - Renvoye le message à l'expéditeur pour confirmation et synchro
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const user = (client as unknown as AuthenticatedSocket).user;
    if (!user) throw new WsException('Unauthorized'); // Refuse l'accès si non authentifié

    // 1. Sauvegarder le message en base
    const message = await this.chatService.sendMessage(user.id, dto);

    // 2. Emettre le message au destinataire (s'il est connecté)
    this.server.to(`user:${dto.recipientId}`).emit('newMessage', message);

    // 3. Renvoyer le message à l'expéditeur (confirmation + synchro autres devices)
    return message;
  }
}
