import {
  BadRequestException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Temporary actor identity until JWT auth lands.
 * Pass `X-User-Id: <uuid>` on protected routes.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const userId = request.header('x-user-id')?.trim();

    if (!userId) {
      throw new BadRequestException(
        'Missing X-User-Id header (temporary auth until JWT)',
      );
    }

    return userId;
  },
);
