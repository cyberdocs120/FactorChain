import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { Button } from '../ui/button';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected, connect, disconnect } = useWallet();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-primary">FactorChain</Link>
            <div className="hidden md:flex gap-4">
              <Link to="/marketplace" className="text-sm font-medium hover:text-primary/80">Marketplace</Link>
              <Link to="/seller" className="text-sm font-medium hover:text-primary/80">Seller Portal</Link>
              <Link to="/buyer" className="text-sm font-medium hover:text-primary/80">Buyer Portal</Link>
              <Link to="/portfolio" className="text-sm font-medium hover:text-primary/80">Portfolio</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden lg:inline">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <Button variant="outline" size="sm" onClick={disconnect}>Disconnect</Button>
              </div>
            ) : (
              <Button size="sm" onClick={connect}>Connect Wallet</Button>
            )}
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
