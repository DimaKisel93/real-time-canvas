declare module 'passport-jwt' {
  import type { Request } from 'express';
  import { Strategy as PassportStrategy } from 'passport-strategy';

  export type JwtFromRequestFunction = (req: Request) => string | null;

  export interface StrategyOptions {
    jwtFromRequest: JwtFromRequestFunction;
    secretOrKey: string | Buffer;
    ignoreExpiration?: boolean;
    passReqToCallback?: boolean;
  }

  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: (
        payload: unknown,
        done: (error: unknown, user?: unknown, info?: unknown) => void,
      ) => void,
    );
  }

  export const ExtractJwt: {
    fromAuthHeaderAsBearerToken(): JwtFromRequestFunction;
  };
}
