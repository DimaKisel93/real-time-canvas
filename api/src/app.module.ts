import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { BoardsModule } from './boards/boards.module.js';
import { CanvasModule } from './canvas/canvas.module.js';
import { ElementsModule } from './elements/elements.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BoardsModule,
    ElementsModule,
    CanvasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
