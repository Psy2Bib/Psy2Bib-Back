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
  cors: { origin: '*' },
  namespace: 'chat',
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client Chat connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client Chat disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket) {
    const user = (client as unknown as AuthenticatedSocket).user;
    if (!user) throw new WsException('Unauthorized');

    // L'utilisateur rejoint sa propre room "user:ID" pour recevoir ses messages privés
    void client.join(`user:${user.id}`);
    this.logger.log(`User ${user.id} joined their private chat room`);

    return { event: 'joined', data: `user:${user.id}` };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const user = (client as unknown as AuthenticatedSocket).user;
    if (!user) throw new WsException('Unauthorized');

    // 1. Sauvegarder le message en base
    const message = await this.chatService.sendMessage(user.id, dto);

    // 2. Emettre le message au destinataire (s'il est connecté)
    this.server.to(`user:${dto.recipientId}`).emit('newMessage', message);

    // 3. Renvoyer le message à l'expéditeur (confirmation + synchro autres devices)
    return message;
  }
}
