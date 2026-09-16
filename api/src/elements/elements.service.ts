import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BoardRole,
  CanvasEventType,
  type Prisma,
} from '../generated/prisma/client.js';
import { BoardsService } from '../boards/boards.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateElementDto } from './dto/create-element.dto.js';
import type { UpdateElementDto } from './dto/update-element.dto.js';

@Injectable()
export class ElementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardsService: BoardsService,
  ) {}

  async findAll(boardId: string, userId: string) {
    await this.boardsService.assertMember(boardId, userId);

    return this.prisma.canvasElement.findMany({
      where: { boardId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(boardId: string, elementId: string, userId: string) {
    await this.boardsService.assertMember(boardId, userId);
    return this.getActiveElement(boardId, elementId);
  }

  async create(boardId: string, userId: string, dto: CreateElementDto) {
    await this.boardsService.assertMember(boardId, userId, [
      BoardRole.OWNER,
      BoardRole.EDITOR,
    ]);

    return this.prisma.$transaction(async (tx) => {
      const element = await tx.canvasElement.create({
        data: {
          boardId,
          createdById: userId,
          type: dto.type,
          x: dto.x,
          y: dto.y,
          width: dto.width,
          height: dto.height,
          rotation: dto.rotation,
          color: dto.color,
          text: dto.text,
          data: dto.data as Prisma.InputJsonValue | undefined,
        },
      });

      await tx.canvasEvent.create({
        data: {
          boardId,
          elementId: element.id,
          userId,
          type: CanvasEventType.ELEMENT_CREATED,
          payload: element as unknown as Prisma.InputJsonValue,
          version: element.version,
        },
      });

      return element;
    });
  }

  async update(
    boardId: string,
    elementId: string,
    userId: string,
    dto: UpdateElementDto,
  ) {
    await this.boardsService.assertMember(boardId, userId, [
      BoardRole.OWNER,
      BoardRole.EDITOR,
    ]);

    const { version, ...patch } = dto;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.canvasElement.updateMany({
        where: {
          id: elementId,
          boardId,
          deletedAt: null,
          version,
        },
        data: {
          ...patch,
          data: patch.data as Prisma.InputJsonValue | undefined,
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        return null;
      }

      const element = await tx.canvasElement.findFirstOrThrow({
        where: { id: elementId, boardId },
      });

      const eventType =
        patch.x !== undefined || patch.y !== undefined
          ? CanvasEventType.ELEMENT_MOVED
          : CanvasEventType.ELEMENT_UPDATED;

      await tx.canvasEvent.create({
        data: {
          boardId,
          elementId,
          userId,
          type: eventType,
          payload: patch as Prisma.InputJsonValue,
          version: element.version,
        },
      });

      return element;
    });

    if (!result) {
      const current = await this.prisma.canvasElement.findFirst({
        where: { id: elementId, boardId, deletedAt: null },
      });

      if (!current) {
        throw new NotFoundException('Element not found');
      }

      throw new ConflictException({
        message: 'Version conflict — rebase required',
        current,
      });
    }

    return result;
  }

  async remove(boardId: string, elementId: string, userId: string) {
    await this.boardsService.assertMember(boardId, userId, [
      BoardRole.OWNER,
      BoardRole.EDITOR,
    ]);

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.canvasElement.findFirst({
        where: { id: elementId, boardId, deletedAt: null },
      });

      if (!existing) {
        return null;
      }

      const element = await tx.canvasElement.update({
        where: { id: elementId },
        data: {
          deletedAt: new Date(),
          version: { increment: 1 },
        },
      });

      await tx.canvasEvent.create({
        data: {
          boardId,
          elementId,
          userId,
          type: CanvasEventType.ELEMENT_DELETED,
          payload: { id: elementId },
          version: element.version,
        },
      });

      return element;
    });

    if (!result) {
      throw new NotFoundException('Element not found');
    }

    return { deleted: true, id: elementId, version: result.version };
  }

  private async getActiveElement(boardId: string, elementId: string) {
    const element = await this.prisma.canvasElement.findFirst({
      where: { id: elementId, boardId, deletedAt: null },
    });

    if (!element) {
      throw new NotFoundException('Element not found');
    }

    return element;
  }
}
