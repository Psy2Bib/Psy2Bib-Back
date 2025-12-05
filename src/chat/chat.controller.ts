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

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

@ApiTags('chat')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversation/:userId')
  @ApiOperation({
    summary: 'Récupérer une conversation',
    description:
      "Récupère tout l'historique des messages chiffrés avec un utilisateur spécifique.",
  })
  @ApiParam({ name: 'userId', description: "ID de l'interlocuteur" })
  @ApiResponse({ status: 200, description: 'Liste des messages' })
  async getConversation(
    @Req() req: AuthRequest,
    @Param('userId') otherUserId: string,
  ) {
    return this.chatService.getConversation(req.user.id, otherUserId);
  }
}
