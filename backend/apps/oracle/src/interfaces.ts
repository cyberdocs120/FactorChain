export interface ScoreSignal {
  provider: string;
  score: number;
  weight: number;
}

export interface BuyerScore {
  buyer_address: string;
  score: number;
  signals: ScoreSignal[];
  timestamp: number;
}

export interface ScoreProvider {
  name: string;
  fetchScore(buyerAddress: string): Promise<number>;
}
