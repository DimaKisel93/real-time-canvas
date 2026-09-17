import { IsUUID } from 'class-validator';
import { CreateElementDto } from '../../elements/dto/create-element.dto.js';

export class WsCreateElementDto extends CreateElementDto {
  @IsUUID()
  boardId!: string;
}
