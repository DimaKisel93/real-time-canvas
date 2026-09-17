import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BoardsModule } from '../boards/boards.module.js';
import { ElementsModule } from '../elements/elements.module.js';
import { CanvasGateway } from './canvas.gateway.js';

@Module({
  imports: [AuthModule, BoardsModule, ElementsModule],
  providers: [CanvasGateway],
})
export class CanvasModule {}
