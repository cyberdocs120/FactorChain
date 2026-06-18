import { useCallback } from 'react';
import { useWalletStore } from '../store/walletStore';
import { 
  isConnected as isFreighterConnected, 
  signTransaction,
  getPublicKey,
} from '@stellar/freighter-api';
import { Keypair } from '@stellar/stellar-sdk';

// TODO: Add multi-wallet support (Lobstr, Albedo, xBull).
// Currently only Freighter is implemented.
// See README "Multi-wallet support" in core features.
// Add a wallet provider abstraction that unifies the different SDKs.

export const isValidStellarAddress = (addr: string): boolean => {
  try {
    Keypair.fromPublicKey(addr);
    return true;
  } catch {
    return false;
  }
};

export const useWallet = () => {
  const { address, isConnected, setAddress, disconnect } = useWalletStore();

  const connect = useCallback(async () => {
    try {
      const connected = await isFreighterConnected();
      if (connected) {
        const publicKey = await getPublicKey();
        if (publicKey && isValidStellarAddress(publicKey)) {
          setAddress(publicKey);
          return publicKey;
        }
      }
      return null;
    } catch {
      return null;
    }
  }, [setAddress]);

  return {
    address,
    isConnected,
    connect,
    disconnect,
    signTransaction,
    isValidStellarAddress,
  };
};
