import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Keypair } from '@stellar/stellar-sdk';
import { JwtService } from '@nestjs/jwt';

interface ChallengeEntry {
  challenge: string;
  address: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private challenges = new Map<string, ChallengeEntry>();

  constructor(private jwtService: JwtService) {}

  generateChallenge(address: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const random = randomBytes(16).toString('hex');
    const challenge = `factorchain:auth:${timestamp}:${random}`;

    this.challenges.set(address, {
      challenge,
      address,
      expiresAt: timestamp + 300,
    });

    return challenge;
  }

  async verifyChallenge(
    address: string,
    challenge: string,
    signature: string,
  ): Promise<{ access_token: string; expires_in: number }> {
    const entry = this.challenges.get(address);
    if (!entry || entry.challenge !== challenge) {
      throw new UnauthorizedException('Invalid challenge');
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > entry.expiresAt) {
      this.challenges.delete(address);
      throw new UnauthorizedException('Challenge expired');
    }

    try {
      const keypair = Keypair.fromPublicKey(address);
      const isValid = keypair.verify(
        Buffer.from(challenge, 'utf-8'),
        Buffer.from(signature, 'base64'),
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid signature');
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Signature verification failed');
    }

    this.challenges.delete(address);

    const payload = { sub: address, address };
    const expiresIn = 86400;
    const access_token = this.jwtService.sign(payload, { expiresIn });

    return { access_token, expires_in: expiresIn };
  }
}
