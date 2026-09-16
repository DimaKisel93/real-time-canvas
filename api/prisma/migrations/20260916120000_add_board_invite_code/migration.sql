ALTER TABLE "boards" ADD COLUMN "inviteCode" TEXT;

UPDATE "boards" SET "inviteCode" = gen_random_uuid()::text WHERE "inviteCode" IS NULL;

ALTER TABLE "boards" ALTER COLUMN "inviteCode" SET NOT NULL;
ALTER TABLE "boards" ALTER COLUMN "inviteCode" SET DEFAULT gen_random_uuid()::text;

CREATE UNIQUE INDEX "boards_inviteCode_key" ON "boards"("inviteCode");
