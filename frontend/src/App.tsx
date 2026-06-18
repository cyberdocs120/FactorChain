import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/shared/Layout';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { Toaster } from 'sonner';

// Pages
import { Marketplace } from './pages/Marketplace';
import { SellerPortal } from './pages/SellerPortal';
import { BuyerPortal } from './pages/BuyerPortal';
import { InvestorPortfolio } from './pages/InvestorPortfolio';
import { AdminDashboard } from './pages/AdminDashboard';

const Home = () => (
  <div className="text-center py-20 space-y-6">
    <h1 className="text-5xl font-bold tracking-tight">FactorChain</h1>
    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
      Institutional-grade invoice factoring on Stellar Soroban. 
      Unlock liquidity for SMEs with transparent, on-chain risk scoring.
    </p>
    <div className="flex justify-center gap-4">
      <a href="/marketplace" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
        Browse Marketplace
      </a>
      <a href="/seller" className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
        Sell Invoices
      </a>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: unknown) => {
        const message = error instanceof Error ? 'An unexpected error occurred' : 'An unexpected error occurred';
        console.error('Mutation error:', message);
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/seller" element={<SellerPortal />} />
              <Route path="/buyer" element={<BuyerPortal />} />
              <Route path="/portfolio" element={<InvestorPortfolio />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </Layout>
        </Router>
        <Toaster position="top-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
