import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  Patch,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
  StreamableFile,
  NotFoundException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { createReadStream, existsSync } from 'fs';
import type { Response } from 'express';
import { Request } from 'express';

import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';

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

  @Post('send')
  @ApiOperation({
    summary: 'Envoyer un message chiffré',
    description:
      'Envoie un message E2EE à un utilisateur (encryptedContent, iv requis)',
  })
  async sendMessage(@Req() req: AuthRequest, @Body() dto: SendMessageDto) {
    const message = await this.chatService.sendMessage(req.user.id, dto);
    return message;
  }

  @Post('attachment')
  @ApiOperation({
    summary: 'Uploader une pièce jointe chiffrée',
    description:
      'Upload un fichier déjà chiffré par le client et retourne son chemin relatif.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/attachments',
        filename: (req, file, cb) => {
          const uniqueSuffix = randomUUID();
          // On garde l'extension .enc pour indiquer que c'est un blob chiffré
          cb(null, `${uniqueSuffix}.enc`);
        },
      }),
      limits: {
        fileSize: 15 * 1024 * 1024, // Limite à 15MB
      },
    }),
  )
  uploadAttachment(
    @Req() req: AuthRequest,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    // On retourne le chemin relatif que le frontend devra envoyer dans le message
    return {
      path: `uploads/attachments/${file.filename}`,
      filename: file.filename,
    };
  }

  @Get('attachment/:filename')
  @ApiOperation({
    summary: 'Télécharger une pièce jointe chiffrée',
    description:
      'Permet de récupérer le blob chiffré pour le déchiffrer localement.',
  })
  getAttachment(
    @Req() req: AuthRequest,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    // Protection basique contre le path traversal
    const safeFilename = filename.replace(/(\.\.[\/\\])+/g, '');
    const filePath = join(
      process.cwd(),
      'uploads',
      'attachments',
      safeFilename,
    );

    if (!existsSync(filePath)) {
      throw new NotFoundException('Fichier non trouvé');
    }

    const file = createReadStream(filePath);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
    });

    return new StreamableFile(file);
  }

  @Get('threads')
  @ApiOperation({
    summary: 'Lister les conversations',
    description: 'Renvoie les conversations (peer + dernier message + unread)',
  })
  async listThreads(@Req() req: AuthRequest) {
    return this.chatService.listThreads(req.user.id);
  }

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

  @Patch('conversation/:userId/read')
  @ApiOperation({
    summary: 'Marquer une conversation comme lue',
    description:
      'Marque comme lus les messages reçus depuis un utilisateur donné.',
  })
  @ApiParam({ name: 'userId', description: "ID de l'interlocuteur" })
  async markAsRead(
    @Req() req: AuthRequest,
    @Param('userId') otherUserId: string,
  ) {
    await this.chatService.markConversationAsRead(req.user.id, otherUserId);
    return { success: true };
  }

  @Get('unread/count')
  @ApiOperation({
    summary: 'Compter les messages non lus',
  })
  async unreadCount(@Req() req: AuthRequest) {
    return this.chatService.countUnread(req.user.id);
  }
}
