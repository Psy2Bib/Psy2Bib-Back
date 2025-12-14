import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { User } from '../users/user.entity';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private sortPair(a: string, b: string) {
    return a < b ? [a, b] : [b, a];
  }

  private async getOrCreateConversation(userId: string, otherUserId: string) {
    const [id1, id2] = this.sortPair(userId, otherUserId);
    let convo = await this.conversationRepo.findOne({
      where: { userA: { id: id1 }, userB: { id: id2 } },
    });
    if (!convo) {
      convo = this.conversationRepo.create({
        userA: { id: id1 } as User,
        userB: { id: id2 } as User,
      });
      convo = await this.conversationRepo.save(convo);
    }
    return convo;
  }

  async sendMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    const recipient = await this.userRepo.findOne({
      where: { id: dto.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    // TODO: Vérifier ici si sender et recipient ont une relation (RDV) pour éviter le spam.
    // Pour l'instant on autorise tout échange authentifié.

    const conversation = await this.getOrCreateConversation(
      senderId,
      dto.recipientId,
    );

    const message = this.messageRepo.create({
      sender: { id: senderId } as User,
      recipient: { id: dto.recipientId } as User,
      encryptedContent: dto.encryptedContent,
      iv: dto.iv,
      attachmentPath: dto.attachmentPath, // Ajout du chemin du fichier chiffré
      isRead: false,
      conversation,
    });

    await this.conversationRepo.update(conversation.id, {
      lastMessageAt: new Date(),
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
        attachmentPath: true, // Inclure le chemin de la pièce jointe
        isRead: true,
        readAt: true,
        createdAt: true,
        sender: { id: true },
        recipient: { id: true },
      },
    });
  }

  async markConversationAsRead(userId: string, otherUserId: string) {
    await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true, readAt: () => 'CURRENT_TIMESTAMP' })
      .where('recipientId = :userId', { userId })
      .andWhere('senderId = :otherId', { otherId: otherUserId })
      .andWhere('isRead = false')
      .execute();
  }

  async countUnread(userId: string) {
    const count = await this.messageRepo.count({
      where: { recipient: { id: userId }, isRead: false },
    });
    return { count };
  }

  async listThreads(userId: string) {
    const convos = await this.conversationRepo.find({
      where: [{ userA: { id: userId } }, { userB: { id: userId } }],
      relations: ['userA', 'userB'],
      order: { lastMessageAt: 'DESC' },
    });

    const threads: {
      id: string;
      peer: { id: string; pseudo?: string; email?: string };
      lastMessage: Message | null;
      unreadCount: number;
    }[] = [];
    for (const convo of convos) {
      const peer = convo.userA.id === userId ? convo.userB : convo.userA;
      const lastMessage = await this.messageRepo.findOne({
        where: { conversation: { id: convo.id } },
        order: { createdAt: 'DESC' },
        relations: ['sender', 'recipient'],
        select: {
          id: true,
          encryptedContent: true,
          iv: true,
          attachmentPath: true,
          createdAt: true,
          sender: { id: true },
          recipient: { id: true },
        },
      });

      const unreadCount = await this.messageRepo.count({
        where: { conversation: { id: convo.id }, recipient: { id: userId }, isRead: false },
      });

      threads.push({
        id: convo.id,
        peer: {
          id: peer.id,
          pseudo: peer.pseudo,
          email: peer.email,
        },
        lastMessage,
        unreadCount,
      });
    }

    return threads;
  }
}
