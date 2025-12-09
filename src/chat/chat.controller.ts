import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

// Interface étendant Request pour inclure l'utilisateur authentifié
interface AuthRequest extends Request {
  user: {
    id: string;   // ID de l'utilisateur connecté
    role: string; // Rôle de l'utilisateur
  };
}

@ApiTags('chat') // Regroupe toutes les routes sous le tag 'chat' dans Swagger
@ApiBearerAuth('JWT-auth') // Indique que ce contrôleur nécessite un token Bearer
@UseGuards(JwtAuthGuard) // Applique le guard JWT pour sécuriser toutes les routes
@Controller('chat') // Préfixe des routes : /chat
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Endpoint GET /chat/conversation/:userId
   * Récupère tout l'historique des messages chiffrés avec un autre utilisateur
   */
  @Get('conversation/:userId')
  @ApiOperation({
    summary: 'Récupérer une conversation',
    description:
      "Récupère tout l'historique des messages chiffrés avec un utilisateur spécifique.",
  })
  @ApiParam({ name: 'userId', description: "ID de l'interlocuteur" })
  @ApiResponse({ status: 200, description: 'Liste des messages' })
  async getConversation(
    @Req() req: AuthRequest,         // L'utilisateur authentifié via JWT
    @Param('userId') otherUserId: string, // ID de l'autre utilisateur
  ) {
    // Appelle le service pour récupérer la conversation entre les deux utilisateurs
    return this.chatService.getConversation(req.user.id, otherUserId);
  }
}
