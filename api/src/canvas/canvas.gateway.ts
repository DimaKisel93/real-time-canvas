import {
  ConflictException,
  ForbiddenException,
  Logger,
  NotFoundException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { BoardsService } from '../boards/boards.service.js';
import { ElementsService } from '../elements/elements.service.js';
import { BoardRoomDto } from './dto/board-room.dto.js';
import { WsCreateElementDto } from './dto/ws-create-element.dto.js';
import { WsDeleteElementDto } from './dto/ws-delete-element.dto.js';
import { WsUpdateElementDto } from './dto/ws-update-element.dto.js';
import { boardRoom, CanvasEvents } from './canvas.events.js';

type SocketData = {
  user: AuthUser;
  boardIds: Set<string>;
};

type AuthedSocket = Socket & { data: SocketData };

const wsValidation = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/canvas',
})
@UsePipes(wsValidation)
export class CanvasGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(CanvasGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly boardsService: BoardsService,
    private readonly elementsService: ElementsService,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket, next) => {
      try {
        const token = this.extractToken(socket);
        if (!token) {
          throw new Error('Missing token');
        }

        const user = await this.authService.authenticateToken(token);
        const data = socket.data as SocketData;
        data.user = user;
        data.boardIds = new Set();
        next();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unauthorized';
        next(new Error(message));
      }
    });
  }

  handleConnection(client: AuthedSocket) {
    const user = client.data.user;
    this.logger.log(`Socket connected: ${user.email} (${client.id})`);
  }

  handleDisconnect(client: AuthedSocket) {
    const user = client.data?.user;
    const boardIds = client.data?.boardIds;
    if (!user || !boardIds) {
      return;
    }

    for (const boardId of boardIds) {
      client.to(boardRoom(boardId)).emit(CanvasEvents.PRESENCE_LEFT, {
        boardId,
        user: this.publicUser(user),
      });
    }

    this.logger.log(`Socket disconnected: ${user.email} (${client.id})`);
  }

  @SubscribeMessage(CanvasEvents.BOARD_JOIN)
  async joinBoard(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: BoardRoomDto,
  ) {
    const user = this.requireUser(client);
    const role = await this.boardsService.assertMember(body.boardId, user.id);
    const elements = await this.elementsService.findAll(body.boardId, user.id);

    await client.join(boardRoom(body.boardId));
    client.data.boardIds.add(body.boardId);

    client.to(boardRoom(body.boardId)).emit(CanvasEvents.PRESENCE_JOINED, {
      boardId: body.boardId,
      user: this.publicUser(user),
    });

    return {
      ok: true as const,
      boardId: body.boardId,
      role,
      elements,
      user: this.publicUser(user),
    };
  }

  @SubscribeMessage(CanvasEvents.BOARD_LEAVE)
  async leaveBoard(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: BoardRoomDto,
  ) {
    const user = this.requireUser(client);
    await client.leave(boardRoom(body.boardId));
    client.data.boardIds.delete(body.boardId);

    client.to(boardRoom(body.boardId)).emit(CanvasEvents.PRESENCE_LEFT, {
      boardId: body.boardId,
      user: this.publicUser(user),
    });

    return {
      ok: true as const,
      boardId: body.boardId,
    };
  }

  @SubscribeMessage(CanvasEvents.ELEMENT_CREATE)
  async createElement(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: WsCreateElementDto,
  ) {
    const user = this.requireUser(client);
    this.assertInBoard(client, body.boardId);

    try {
      const { boardId, ...dto } = body;
      const element = await this.elementsService.create(boardId, user.id, dto);

      client.to(boardRoom(boardId)).emit(CanvasEvents.ELEMENT_CREATED, {
        boardId,
        element,
        userId: user.id,
      });

      return { ok: true as const, element };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage(CanvasEvents.ELEMENT_UPDATE)
  async updateElement(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: WsUpdateElementDto,
  ) {
    const user = this.requireUser(client);
    this.assertInBoard(client, body.boardId);

    try {
      const { boardId, elementId, ...dto } = body;
      const element = await this.elementsService.update(
        boardId,
        elementId,
        user.id,
        dto,
      );

      client.to(boardRoom(boardId)).emit(CanvasEvents.ELEMENT_UPDATED, {
        boardId,
        element,
        userId: user.id,
      });

      return { ok: true as const, element };
    } catch (error) {
      if (error instanceof ConflictException) {
        const response = error.getResponse();
        const payload =
          typeof response === 'string'
            ? { message: response }
            : (response as Record<string, unknown>);

        client.emit(CanvasEvents.ELEMENT_CONFLICT, {
          boardId: body.boardId,
          elementId: body.elementId,
          ...payload,
        });

        return {
          ok: false as const,
          code: 'CONFLICT' as const,
          ...payload,
        };
      }

      throw this.toWsException(error);
    }
  }

  @SubscribeMessage(CanvasEvents.ELEMENT_DELETE)
  async deleteElement(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: WsDeleteElementDto,
  ) {
    const user = this.requireUser(client);
    this.assertInBoard(client, body.boardId);

    try {
      const result = await this.elementsService.remove(
        body.boardId,
        body.elementId,
        user.id,
      );

      client.to(boardRoom(body.boardId)).emit(CanvasEvents.ELEMENT_DELETED, {
        boardId: body.boardId,
        ...result,
        userId: user.id,
      });

      return { ok: true as const, ...result };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken.trim()) {
      return queryToken.trim();
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length).trim();
    }

    return undefined;
  }

  private requireUser(client: AuthedSocket): AuthUser {
    if (!client.data?.user) {
      throw new WsException('Unauthorized');
    }
    return client.data.user;
  }

  private assertInBoard(client: AuthedSocket, boardId: string) {
    if (!client.data.boardIds?.has(boardId)) {
      throw new WsException('Join the board room first (board:join)');
    }
  }

  private publicUser(user: AuthUser) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }

  private toWsException(error: unknown): WsException {
    if (error instanceof WsException) {
      return error;
    }

    if (
      error instanceof ForbiddenException ||
      error instanceof NotFoundException
    ) {
      const response = error.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : ((response as { message?: string | string[] }).message ??
            error.message);
      return new WsException(message);
    }

    this.logger.error(
      error instanceof Error ? error.message : 'Unknown WS error',
      error instanceof Error ? error.stack : undefined,
    );
    return new WsException('Internal server error');
  }
}
