export const boardRoom = (boardId: string) => `board:${boardId}`;

export const CanvasEvents = {
  BOARD_JOIN: 'board:join',
  BOARD_LEAVE: 'board:leave',
  BOARD_JOINED: 'board:joined',
  BOARD_LEFT: 'board:left',
  PRESENCE_JOINED: 'presence:joined',
  PRESENCE_LEFT: 'presence:left',
  ELEMENT_CREATE: 'element:create',
  ELEMENT_UPDATE: 'element:update',
  ELEMENT_DELETE: 'element:delete',
  ELEMENT_CREATED: 'element:created',
  ELEMENT_UPDATED: 'element:updated',
  ELEMENT_DELETED: 'element:deleted',
  ELEMENT_CONFLICT: 'element:conflict',
} as const;
