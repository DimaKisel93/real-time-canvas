import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module.js';
import { ElementsController } from './elements.controller.js';
import { ElementsService } from './elements.service.js';

@Module({
  imports: [BoardsModule],
  controllers: [ElementsController],
  providers: [ElementsService],
  exports: [ElementsService],
})
export class ElementsModule {}
