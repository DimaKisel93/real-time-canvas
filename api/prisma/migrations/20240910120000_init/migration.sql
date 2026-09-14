-- CreateSchema is handled by Prisma (public).

CREATE TYPE "BoardRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');
CREATE TYPE "ElementType" AS ENUM ('STICKER', 'ARROW', 'COMMENT');
CREATE TYPE "CanvasEventType" AS ENUM ('ELEMENT_CREATED', 'ELEMENT_MOVED', 'ELEMENT_UPDATED', 'ELEMENT_DELETED');

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "boards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "board_members" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BoardRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "canvas_elements" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "type" "ElementType" NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 120,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#FFE566',
    "text" TEXT,
    "data" JSONB,
    "createdById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canvas_elements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "canvas_events" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "elementId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "CanvasEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "version" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canvas_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "canvas_snapshots" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canvas_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "boards_createdById_idx" ON "boards"("createdById");
CREATE UNIQUE INDEX "board_members_boardId_userId_key" ON "board_members"("boardId", "userId");
CREATE INDEX "board_members_userId_idx" ON "board_members"("userId");
CREATE INDEX "canvas_elements_boardId_deletedAt_idx" ON "canvas_elements"("boardId", "deletedAt");
CREATE INDEX "canvas_events_boardId_createdAt_idx" ON "canvas_events"("boardId", "createdAt");
CREATE INDEX "canvas_events_elementId_idx" ON "canvas_events"("elementId");
CREATE UNIQUE INDEX "canvas_snapshots_boardId_sequence_key" ON "canvas_snapshots"("boardId", "sequence");
CREATE INDEX "canvas_snapshots_boardId_createdAt_idx" ON "canvas_snapshots"("boardId", "createdAt");

ALTER TABLE "boards" ADD CONSTRAINT "boards_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "board_members" ADD CONSTRAINT "board_members_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "board_members" ADD CONSTRAINT "board_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canvas_elements" ADD CONSTRAINT "canvas_elements_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canvas_elements" ADD CONSTRAINT "canvas_elements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "canvas_events" ADD CONSTRAINT "canvas_events_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canvas_events" ADD CONSTRAINT "canvas_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "canvas_snapshots" ADD CONSTRAINT "canvas_snapshots_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
