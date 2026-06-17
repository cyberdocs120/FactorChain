import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  network: string | null;
  setAddress: (address: string | null) => void;
  setNetwork: (network: string | null) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      isConnected: false,
      network: null,
      setAddress: (address) => set({ address, isConnected: !!address }),
      setNetwork: (network) => set({ network }),
      disconnect: () => set({ address: null, isConnected: false, network: null }),
    }),
    {
      name: 'wallet-storage',
    }
  )
);
