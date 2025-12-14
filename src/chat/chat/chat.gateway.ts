/**
 * Gateway WebSocket pour la messagerie instantanée chiffrée
 * 
 * Gère les connexions WebSocket pour le chat en temps réel.
 * Les messages sont chiffrés de bout en bout (E2EE), le serveur
 * ne fait que router les blobs chiffrés.
 * 
 * Namespace : /chat
 * 
 * @module chat
 */

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

/**
 * Gateway ChatGateway
 * 
 * Serveur WebSocket pour la messagerie temps-réel.
 * Protégé par WsJwtGuard - seuls les utilisateurs authentifiés peuvent se connecter.
 * 
 * Architecture :
 * - Chaque utilisateur rejoint sa room privée "user:ID"
 * - Les messages sont routés vers la room du destinataire
 * - Le contenu est chiffré, le serveur ne peut pas le lire
 */
@WebSocketGateway({
  cors: { origin: '*' }, // TODO: Restreindre en production
  namespace: 'chat', // URL: ws://localhost:5500/chat
})
@UseGuards(WsJwtGuard) // Vérifie le JWT à chaque message
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  /**
   * Hook appelé lors de la connexion d'un client
   * 
   * Le guard WsJwtGuard a déjà validé le JWT et attaché user au socket.
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client Chat connected: ${client.id}`);
  }

  /**
   * Hook appelé lors de la déconnexion d'un client
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client Chat disconnected: ${client.id}`);
  }

  /**
   * Événement 'join' - Rejoindre sa room privée
   * 
   * Chaque utilisateur rejoint automatiquement sa room "user:ID" pour
   * recevoir ses messages privés. C'est comme une boîte de réception.
   * 
   * @param client - Socket du client connecté
   * @returns Confirmation avec le nom de la room
   */
  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket) {
    const user = (client as unknown as AuthenticatedSocket).user;
    if (!user) throw new WsException('Unauthorized');

    /**
     * Jointure de la room privée
     * 
     * Room "user:ID" => Tous les messages envoyés à cet utilisateur
     * arriveront dans cette room.
     */
    void client.join(`user:${user.id}`);
    this.logger.log(`User ${user.id} joined their private chat room`);

    return { event: 'joined', data: `user:${user.id}` };
  }

  /**
   * Événement 'sendMessage' - Envoyer un message chiffré
   * 
   * Workflow :
   * 1. Client envoie { recipientId, encryptedContent, iv }
   * 2. Serveur sauvegarde en base (message chiffré)
   * 3. Serveur émet vers la room du destinataire (si connecté)
   * 4. Serveur confirme à l'expéditeur (confirmation + synchro multi-device)
   * 
   * @param client - Socket de l'expéditeur
   * @param dto - Données du message (recipientId, blob chiffré, iv)
   * @returns Le message sauvegardé
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const user = (client as unknown as AuthenticatedSocket).user;
    if (!user) throw new WsException('Unauthorized');

    /**
     * 1. Sauvegarde en base de données
     * 
     * Le message est stocké tel quel (chiffré).
     * Permet de récupérer l'historique même si le destinataire est offline.
     */
    const message = await this.chatService.sendMessage(user.id, dto);

    /**
     * 2. Émission vers le destinataire
     * 
     * Si le destinataire est connecté (dans sa room "user:ID"),
     * il reçoit le message instantanément.
     * S'il est offline, il le récupérera via l'historique.
     */
    this.server.to(`user:${dto.recipientId}`).emit('newMessage', message);

    /**
     * 3. Confirmation à l'expéditeur
     * 
     * Renvoie le message avec son ID et timestamp pour :
     * - Confirmer l'envoi
     * - Synchro multi-device (si l'user est connecté sur plusieurs appareils)
     * - Afficher le message immédiatement dans l'UI
     */
    return message;
  }
}
