import { IsUUID } from 'class-validator';

export class BoardRoomDto {
  @IsUUID()
  boardId!: string;
}
