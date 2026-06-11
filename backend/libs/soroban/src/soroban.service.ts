import { Injectable, Logger } from '@nestjs/common';
import { SorobanRpc } from '@stellar/stellar-sdk';

@Injectable()
export class SorobanService {
  private readonly logger = new Logger(SorobanService.name);
  private client: SorobanRpc.Server;

  constructor() {
    const rpcUrl = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
    this.client = new SorobanRpc.Server(rpcUrl);
    this.logger.log(`Soroban client initialized for ${rpcUrl}`);
  }

  getServer(): SorobanRpc.Server {
    return this.client;
  }
}
