import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BoardRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import type { CreateBoardDto } from './dto/create-board.dto.js';
import type { JoinBoardDto } from './dto/join-board.dto.js';
import type { UpdateBoardDto } from './dto/update-board.dto.js';

const boardSelect = {
  id: true,
  title: true,
  inviteCode: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class BoardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateBoardDto) {
    await this.usersService.assertExists(userId);

    return this.prisma.board.create({
      data: {
        title: dto.title,
        createdById: userId,
        members: {
          create: {
            userId,
            role: BoardRole.OWNER,
          },
        },
      },
      select: boardSelect,
    });
  }

  async findAllForUser(userId: string) {
    await this.usersService.assertExists(userId);

    return this.prisma.board.findMany({
      where: {
        members: { some: { userId } },
      },
      select: boardSelect,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(boardId: string, userId: string) {
    await this.assertMember(boardId, userId);

    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: {
        ...boardSelect,
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
              },
            },
          },
        },
        elements: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async update(boardId: string, userId: string, dto: UpdateBoardDto) {
    await this.assertMember(boardId, userId, [BoardRole.OWNER, BoardRole.EDITOR]);

    try {
      return await this.prisma.board.update({
        where: { id: boardId },
        data: { title: dto.title },
        select: boardSelect,
      });
    } catch {
      throw new NotFoundException('Board not found');
    }
  }

  async remove(boardId: string, userId: string) {
    await this.assertMember(boardId, userId, [BoardRole.OWNER]);

    try {
      await this.prisma.board.delete({ where: { id: boardId } });
    } catch {
      throw new NotFoundException('Board not found');
    }

    return { deleted: true };
  }

  async join(userId: string, dto: JoinBoardDto) {
    await this.usersService.assertExists(userId);

    const board = await this.prisma.board.findUnique({
      where: { inviteCode: dto.inviteCode },
      select: boardSelect,
    });

    if (!board) {
      throw new NotFoundException('Invalid invite code');
    }

    await this.prisma.boardMember.upsert({
      where: {
        boardId_userId: {
          boardId: board.id,
          userId,
        },
      },
      create: {
        boardId: board.id,
        userId,
        role: BoardRole.EDITOR,
      },
      update: {},
    });

    return board;
  }

  async assertMember(
    boardId: string,
    userId: string,
    roles?: BoardRole[],
  ): Promise<BoardRole> {
    const membership = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: { boardId, userId },
      },
      select: { role: true },
    });

    if (!membership) {
      const boardExists = await this.prisma.board.count({
        where: { id: boardId },
      });
      if (!boardExists) {
        throw new NotFoundException('Board not found');
      }
      throw new ForbiddenException('Not a board member');
    }

    if (roles && !roles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient board role');
    }

    return membership.role;
  }
}
