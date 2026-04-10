import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { getEthTransactions, getSolTransactions, getBtcTransactions, getSepoliaTransactions } from '../services/blockchain';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, ExternalLink } from 'lucide-react';

const TransactionHistory = ({ coinId }) => {
  const { wallet } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!wallet) return;

    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let txs = [];
        
        if (coinId) {
          // Load transactions for specific coin
          switch (coinId) {
            case 'ethereum':
              txs = await getEthTransactions(wallet.ethereum.address);
              break;
            case 'solana':
              txs = await getSolTransactions(wallet.solana.address);
              break;
            case 'bitcoin':
              txs = await getBtcTransactions(wallet.bitcoin.address);
              break;
            case 'sepolia':
              txs = await getSepoliaTransactions(wallet.ethereum.address);
              break;
          }
        } else {
          // Load transactions for all coins (dashboard view)
          const [ethTxs, solTxs, btcTxs, sepTxs] = await Promise.all([
            getEthTransactions(wallet.ethereum.address).catch(() => []),
            getSolTransactions(wallet.solana.address).catch(() => []),
            getBtcTransactions(wallet.bitcoin.address).catch(() => []),
            getSepoliaTransactions(wallet.ethereum.address).catch(() => [])
          ]);
          
          // Combine and sort by timestamp
          txs = [
            ...ethTxs.map(tx => ({ ...tx, chain: 'ETH' })),
            ...solTxs.map(tx => ({ ...tx, chain: 'SOL' })),
            ...btcTxs.map(tx => ({ ...tx, chain: 'BTC' })),
            ...sepTxs.map(tx => ({ ...tx, chain: 'SEP' }))
          ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
        }
        
        setTransactions(txs);
      } catch (err) {
        console.error('Failed to load transactions:', err);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [wallet, coinId]);

  const getExplorerUrl = (hash, chain) => {
    switch (chain) {
      case 'ETH':
        return `https://etherscan.io/tx/${hash}`;
      case 'SEP':
      case 'SEPOLIA':
        return `https://sepolia.etherscan.io/tx/${hash}`;
      case 'SOL':
        return `https://explorer.solana.com/tx/${hash}`;
      case 'BTC':
        return `https://blockchain.info/tx/${hash}`;
      default:
        return '#';
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!wallet) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-8 text-center">
        <p className="text-gray-400">Please connect your wallet to view transactions</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-white">Recent Activity</h3>
            {!coinId && (
              <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                View All
              </button>
            )}
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-400 mb-2">⚠️ {error}</p>
            <p className="text-xs text-gray-500">
              This might be due to API rate limits or network issues
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowUpRight size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-400 mb-2">No transactions yet</p>
            <p className="text-xs text-gray-500">
              Your transaction history will appear here once you start using your wallet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map((tx, index) => (
                <div key={tx.hash || index} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'Received' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white'
                        }`}>
                            {tx.type === 'Received' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium text-sm">
                                  {tx.type} {tx.chain || coinId?.toUpperCase()}
                              </p>
                              {tx.chain && (
                                <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded">
                                  {tx.chain}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                  {tx.type === 'Received' ? `From ${tx.from?.slice(0, 6)}...${tx.from?.slice(-4)}` : `To ${tx.to?.slice(0, 6)}...${tx.to?.slice(-4)}`}
                              </p>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{formatDate(tx.timestamp)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-right flex items-center gap-3">
                        <div>
                          <p className={`font-semibold text-sm ${tx.type === 'Received' ? 'text-green-400' : 'text-white'}`}>
                              {tx.type === 'Received' ? '+' : '-'}{parseFloat(tx.value).toFixed(6)}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                               {tx.status === 'Confirmed' ? (
                                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">
                                      <CheckCircle2 size={10} className="text-green-500" /> Confirmed
                                  </span>
                               ) : (
                                  <span className="flex items-center gap-1 text-[10px] text-yellow-500/80 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                      <Clock size={10} /> Pending
                                  </span>
                               )}
                          </div>
                        </div>
                        
                        {tx.hash && (
                          <a
                            href={getExplorerUrl(tx.hash, tx.chain || coinId?.toUpperCase())}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                            title="View on explorer"
                          >
                            <ExternalLink size={14} className="text-gray-400 hover:text-white" />
                          </a>
                        )}
                    </div>
                </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default TransactionHistory;