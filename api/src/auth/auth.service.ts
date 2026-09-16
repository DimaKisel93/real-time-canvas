import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { CreateUserDto } from '../users/dto/create-user.dto.js';
import { UsersService } from '../users/users.service.js';
import type { AuthUser, JwtPayload } from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return this.issueAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const account = await this.usersService.findAuthByEmail(dto.email);
    if (!account) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordOk = await bcrypt.compare(dto.password, account.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { passwordHash: _passwordHash, ...user } = account;
    return this.issueAuthResponse(user);
  }

  signAccessToken(user: Pick<AuthUser, 'id' | 'email'>): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  private issueAuthResponse(user: AuthUser) {
    return {
      accessToken: this.signAccessToken(user),
      tokenType: 'Bearer' as const,
      user,
    };
  }
}
