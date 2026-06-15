import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@app/prisma';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'factorchain-dev-secret',
    });
  }

  async validate(payload: { sub: string; address: string }) {
    const user = await this.prisma.user.findUnique({
      where: { address: payload.address },
    });
    if (!user) {
      return { address: payload.address };
    }
    return user;
  }
}
