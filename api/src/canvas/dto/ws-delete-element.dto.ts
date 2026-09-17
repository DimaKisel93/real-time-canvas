import { IsUUID } from 'class-validator';

export class WsDeleteElementDto {
  @IsUUID()
  boardId!: string;

  @IsUUID()
  elementId!: string;
}
