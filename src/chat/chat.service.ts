import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/user.entity';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async sendMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    const recipient = await this.userRepo.findOne({
      where: { id: dto.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    // TODO: Vérifier ici si sender et recipient ont une relation (RDV) pour éviter le spam.
    // Pour l'instant on autorise tout échange authentifié.

    const message = this.messageRepo.create({
      sender: { id: senderId } as User,
      recipient: { id: dto.recipientId } as User,
      encryptedContent: dto.encryptedContent,
      iv: dto.iv,
    });

    return this.messageRepo.save(message);
  }

  /**
   * Récupère l'historique des messages entre l'utilisateur connecté et un autre utilisateur.
   */
  async getConversation(
    userId: string,
    otherUserId: string,
  ): Promise<Message[]> {
    return this.messageRepo.find({
      where: [
        { sender: { id: userId }, recipient: { id: otherUserId } },
        { sender: { id: otherUserId }, recipient: { id: userId } },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender', 'recipient'],
      // On ne renvoie que les IDs des users pour alléger (et sécurité)
      select: {
        id: true,
        encryptedContent: true,
        iv: true,
        createdAt: true,
        sender: { id: true },
        recipient: { id: true },
      },
    });
  }

  /**
   * Récupère la liste des conversations (derniers messages)
   * (Fonctionnalité avancée, on commence par getConversation simple)
   */
}
