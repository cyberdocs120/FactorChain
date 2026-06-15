import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('generateChallenge', () => {
    it('should generate a challenge string for an address', () => {
      const address = 'GABC123...';
      const challenge = service.generateChallenge(address);

      expect(challenge).toContain('factorchain:auth:');
      expect(challenge.split(':').length).toBe(4);
    });

    it('should store challenge for verification', () => {
      const address = 'GABC123...';
      const challenge = service.generateChallenge(address);

      expect(challenge).toBeTruthy();
      expect(typeof challenge).toBe('string');
    });
  });

  describe('verifyChallenge', () => {
    it('should reject invalid challenge', async () => {
      await expect(
        service.verifyChallenge(
          'GABC123...',
          'invalid-challenge',
          'fake-signature',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject expired challenge', async () => {
      const address = 'GABC123...';
      service.generateChallenge(address);

      jest.useFakeTimers();
      jest.advanceTimersByTime(301_000);

      await expect(
        service.verifyChallenge(
          address,
          'factorchain:auth:0:test',
          'fake-signature',
        ),
      ).rejects.toThrow(UnauthorizedException);

      jest.useRealTimers();
    });
  });
});
