import { IsUUID } from 'class-validator';
import { UpdateElementDto } from '../../elements/dto/update-element.dto.js';

export class WsUpdateElementDto extends UpdateElementDto {
  @IsUUID()
  boardId!: string;

  @IsUUID()
  elementId!: string;
}
