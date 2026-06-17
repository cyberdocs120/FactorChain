import { useCallback } from 'react';
import { useWalletStore } from '../store/walletStore';
import { 
  isConnected as isFreighterConnected, 
  signTransaction 
} from '@stellar/freighter-api';
import getPublicKey from '@stellar/freighter-api';

export const useWallet = () => {
  const { address, isConnected, setAddress, disconnect } = useWalletStore();

  const connect = useCallback(async () => {
    try {
      if (await isFreighterConnected()) {
        const publicKey = await (getPublicKey as any)();
        setAddress(publicKey);
        return publicKey;
      } else {
        alert('Freighter not found');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  }, [setAddress]);

  return {
    address,
    isConnected,
    connect,
    disconnect,
    signTransaction,
  };
};
