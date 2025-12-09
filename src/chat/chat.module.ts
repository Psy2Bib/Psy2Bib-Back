import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat/chat.gateway';
import { Message } from './entities/message.entity';
import { User } from '../users/user.entity';

@Module({
  // Modules importés nécessaires pour le fonctionnement du ChatModule
  imports: [
    TypeOrmModule.forFeature([Message, User]), // Entités Message et User pour TypeORM
    JwtModule, // Pour la gestion des JWT (authentification)
    ConfigModule, // Pour accéder aux variables d'environnement
  ],
  controllers: [ChatController], // Contrôleur exposant les endpoints REST
  providers: [
    ChatService, // Service contenant la logique métier du chat
    ChatGateway, // Gateway WebSocket pour la messagerie en temps réel
  ],
})
export class ChatModule {}
