import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import DashboardLayout from '@/components/DashboardLayout';
import AssetCard from '@/components/AssetCard';
import TransactionHistory from '@/components/TransactionHistory';
import { Wifi, MoreVertical, Copy } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, wallet, balances, balanceLoading, getTotalBalance, prices, priceLoading } = useWallet();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate]);

  const handleCopyAddress = async (address, type) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success(`${type} address copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  if (!isAuthenticated || !wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const totalBalance = getTotalBalance();

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Multi-Chain Wallet</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="mb-8 p-8 rounded-3xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-white/10 relative overflow-hidden">
        <div className="bg-primary/20 absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <p className="text-gray-400 mb-2 font-medium">Total Portfolio Value</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            {balanceLoading || priceLoading ? (
              <div className="animate-pulse bg-white/20 h-12 w-64 rounded"></div>
            ) : (
              <>
                {formatCurrency(totalBalance)}
                <span className="text-lg text-green-400 font-medium ml-3 bg-green-500/10 px-2 py-1 rounded-lg">Live</span>
              </>
            )}
          </h2>
        </div>
      </div>

      {/* Wallet Addresses */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-400">Ethereum Address</span>
            <button 
              onClick={() => handleCopyAddress(wallet.ethereum.address, 'Ethereum')}
              className="text-primary hover:text-primary/80"
            >
              <Copy size={14} />
            </button>
          </div>
          <p className="text-white font-mono text-sm break-all">{wallet.ethereum.address}</p>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-400">Solana Address</span>
            <button 
              onClick={() => handleCopyAddress(wallet.solana.address, 'Solana')}
              className="text-primary hover:text-primary/80"
            >
              <Copy size={14} />
            </button>
          </div>
          <p className="text-white font-mono text-sm break-all">{wallet.solana.address}</p>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-400">Bitcoin Address</span>
            <button 
              onClick={() => handleCopyAddress(wallet.bitcoin.address, 'Bitcoin')}
              className="text-primary hover:text-primary/80"
            >
              <Copy size={14} />
            </button>
          </div>
          <p className="text-white font-mono text-sm break-all">{wallet.bitcoin.address}</p>
        </div>
      </div>

      {/* My Assets */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Your Assets</h3>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AssetCard 
            id="ethereum"
            name="Ethereum"
            symbol="ETH"
            amount={balances.ethereum.toFixed(6)}
            value={formatCurrency(balances.ethereum * prices.ethereum.usd)}
            price={formatCurrency(prices.ethereum.usd)}
            change={prices.ethereum.change}
            icon=""
            color="#627EEA"
            loading={balanceLoading || priceLoading}
          />
          <AssetCard 
            id="solana"
            name="Solana"
            symbol="SOL"
            amount={balances.solana.toFixed(6)}
            value={formatCurrency(balances.solana * prices.solana.usd)}
            price={formatCurrency(prices.solana.usd)}
            change={prices.solana.change}
            icon=""
            color="#14F195"
            loading={balanceLoading || priceLoading}
          />
          <AssetCard 
            id="bitcoin"
            name="Bitcoin"
            symbol="BTC"
            amount={balances.bitcoin.toFixed(8)}
            value={formatCurrency(balances.bitcoin * prices.bitcoin.usd)}
            price={formatCurrency(prices.bitcoin.usd)}
            change={prices.bitcoin.change}
            icon=""
            color="#F7931A"
            loading={balanceLoading || priceLoading}
          />
          <AssetCard 
            id="sepolia"
            name="Sepolia Testnet"
            symbol="SEP"
            amount={balances.sepolia.toFixed(6)}
            value={formatCurrency(balances.sepolia * prices.sepolia.usd)}
            price={formatCurrency(prices.sepolia.usd)}
            change={0}
            icon=""
            color="#FF9900"
            loading={balanceLoading || priceLoading}
            isTestnet={true}
          />
        </div>
      </div>



      {/* Recent Activity */}
      <TransactionHistory />

      {/* Security Footer */}
      <div className="mt-12 text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Wifi size={12} className="text-green-500" />
          Encrypted locally • Multi-chain support • Real blockchain data
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;