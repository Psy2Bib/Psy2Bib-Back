import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/user.entity';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    // Injection du repository TypeORM pour l’entité Message
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,

    // Injection du repository TypeORM pour User (utilisé pour vérifier l'existence du destinataire)
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Envoie un message :
   * - vérifie que le destinataire existe
   * - crée une entité Message (contenu déjà chiffré côté client)
   * - enregistre en base
   */
  async sendMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    // Vérification que le destinataire existe
    const recipient = await this.userRepo.findOne({
      where: { id: dto.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    /**
     * TODO IMPORTANT :
     * Ajouter une vérification métier :
     * - le patient ne peut écrire qu'à son psychologue
     * - un psy ne peut écrire qu’à un patient suivi
     * Cela permet d’éviter qu’un utilisateur envoie des messages aléatoires.
     */

    // Création d’un nouveau message (le contenu est déjà chiffré côté front)
    const message = this.messageRepo.create({
      sender: { id: senderId } as User,
      recipient: { id: dto.recipientId } as User,
      encryptedContent: dto.encryptedContent,
      iv: dto.iv,
    });

    // Enregistrement en base
    return this.messageRepo.save(message);
  }

  /**
   * Récupère une conversation complète entre deux utilisateurs (triée par date).
   * On ne renvoie que les champs strictement nécessaires : pas d’email, pas de nom.
   */
  async getConversation(
    userId: string,
    otherUserId: string,
  ): Promise<Message[]> {
    return this.messageRepo.find({
      where: [
        // Messages envoyés par userId → otherUserId
        { sender: { id: userId }, recipient: { id: otherUserId } },
        // Messages envoyés par otherUserId → userId
        { sender: { id: otherUserId }, recipient: { id: userId } },
      ],
      order: { createdAt: 'ASC' }, // Chronologique

      // Charger aussi les infos minimales des relations
      relations: ['sender', 'recipient'],

      /**
       * select :
       * On ne sélectionne QUE les champs essentiels.
       * Cela évite d'exposer les données sensibles des utilisateurs.
       */
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
   * — Fonctionnalité future —
   * Récupérer la liste des dernières conversations (messages récents type "inbox").
   */
}
