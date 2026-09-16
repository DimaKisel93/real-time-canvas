import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator.js';
import { CreateElementDto } from './dto/create-element.dto.js';
import { UpdateElementDto } from './dto/update-element.dto.js';
import { ElementsService } from './elements.service.js';

@Controller('boards/:boardId/elements')
export class ElementsController {
  constructor(private readonly elementsService: ElementsService) {}

  @Get()
  findAll(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.elementsService.findAll(boardId, userId);
  }

  @Post()
  create(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @CurrentUserId() userId: string,
    @Body() dto: CreateElementDto,
  ) {
    return this.elementsService.create(boardId, userId, dto);
  }

  @Get(':elementId')
  findOne(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('elementId', ParseUUIDPipe) elementId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.elementsService.findOne(boardId, elementId, userId);
  }

  @Patch(':elementId')
  update(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('elementId', ParseUUIDPipe) elementId: string,
    @CurrentUserId() userId: string,
    @Body() dto: UpdateElementDto,
  ) {
    return this.elementsService.update(boardId, elementId, userId, dto);
  }

  @Delete(':elementId')
  remove(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('elementId', ParseUUIDPipe) elementId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.elementsService.remove(boardId, elementId, userId);
  }
}
