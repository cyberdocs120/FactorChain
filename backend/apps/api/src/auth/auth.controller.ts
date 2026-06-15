import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '@app/common';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('challenge')
  @ApiOperation({ summary: 'Request a sign challenge for a Stellar address' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { address: { type: 'string', example: 'GABC...XYZ' } },
    },
  })
  requestChallenge(@Body('address') address: string): { challenge: string } {
    const challenge = this.authService.generateChallenge(address);
    return { challenge };
  }

  @Public()
  @Post('verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Submit signed challenge to receive a JWT' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        challenge: { type: 'string' },
        signature: { type: 'string' },
      },
    },
  })
  async verify(
    @Body('address') address: string,
    @Body('challenge') challenge: string,
    @Body('signature') signature: string,
  ) {
    return this.authService.verifyChallenge(address, challenge, signature);
  }
}
