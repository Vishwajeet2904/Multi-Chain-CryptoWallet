import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import DashboardLayout from '@/components/DashboardLayout';
import TransactionHistory from '@/components/TransactionHistory';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Copy, QrCode, Send, Loader } from 'lucide-react';
import { sendEth, sendSol, sendBtc, sendSepolia } from '../services/blockchain';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';

const CoinDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wallet, balances, refreshBalances, prices } = useWallet();
  const [activeTab, setActiveTab] = useState('send');
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sending, setSending] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  // Mock data based on ID with real balances
  const coinData = {
    ethereum: { 
      name: 'Ethereum', 
      symbol: 'ETH', 
      price: formatCurrency(prices.ethereum.usd), 
      balance: balances.ethereum.toFixed(6), 
      color: '#627EEA',
      address: wallet?.ethereum.address,
      privateKey: wallet?.ethereum.privateKey
    },
    solana: { 
      name: 'Solana', 
      symbol: 'SOL', 
      price: formatCurrency(prices.solana.usd), 
      balance: balances.solana.toFixed(6), 
      color: '#14F195',
      address: wallet?.solana.address,
      privateKey: wallet?.solana.privateKey
    },
    bitcoin: { 
      name: 'Bitcoin', 
      symbol: 'BTC', 
      price: formatCurrency(prices.bitcoin.usd), 
      balance: balances.bitcoin.toFixed(8), 
      color: '#F7931A',
      address: wallet?.bitcoin.address,
      privateKey: wallet?.bitcoin.privateKey
    },
    sepolia: {
      name: 'Sepolia Testnet',
      symbol: 'SEP',
      price: 'Test ETH (Free)',
      balance: balances.sepolia.toFixed(6),
      color: '#FF9900',
      address: wallet?.ethereum.address,
      privateKey: wallet?.ethereum.privateKey
    }
  }[id || 'ethereum'] || { name: 'Unknown', symbol: 'UNK', price: '0', balance: '0', color: '#888' };

  const handleSend = async () => {
    if (!sendAmount || !recipientAddress) {
      toast.error('Please fill in all fields');
      return;
    }

    if (parseFloat(sendAmount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (parseFloat(sendAmount) > parseFloat(coinData.balance)) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setSending(true);
      let txHash;

      switch (id) {
        case 'ethereum':
          txHash = await sendEth(coinData.privateKey, recipientAddress, sendAmount);
          break;
        case 'sepolia':
          txHash = await sendSepolia(coinData.privateKey, recipientAddress, sendAmount);
          break;
        case 'solana':
          txHash = await sendSol(coinData.privateKey, recipientAddress, parseFloat(sendAmount));
          break;
        case 'bitcoin':
          txHash = await sendBtc(coinData.privateKey, recipientAddress, parseFloat(sendAmount));
          break;
        default:
          throw new Error('Unsupported coin');
      }

      toast.success(`Transaction sent! Hash: ${txHash.slice(0, 10)}...`);
      setSendAmount('');
      setRecipientAddress('');
      
      // Refresh balances after successful transaction
      setTimeout(() => {
        refreshBalances();
      }, 2000);

    } catch (error) {
      console.error('Send transaction failed:', error);
      toast.error(`Transaction failed: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(coinData.address);
      toast.success('Address copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const setMaxAmount = () => {
    // Leave a small amount for fees
    const maxAmount = id === 'bitcoin' 
      ? Math.max(0, parseFloat(coinData.balance) - 0.0001)
      : Math.max(0, parseFloat(coinData.balance) - 0.001);
    setSendAmount(maxAmount.toString());
  };

  if (!wallet) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading wallet...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
        {/* Back Button */}
        <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-white mb-6 transition-colors"
        >
            <ArrowLeft size={18} /> Back to Dashboard
        </button>

        {/* Header Card */}
        <div className="rounded-3xl p-8 mb-8 relative overflow-hidden border border-white/10">
            <div 
                className="absolute inset-0 opacity-20"
                style={{ 
                    background: `linear-gradient(135deg, ${coinData.color} 0%, transparent 100%)` 
                }}
            />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg" style={{ backgroundColor: coinData.color }}>
                        {coinData.symbol[0]}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{coinData.name}</h1>
                        <p className="text-muted-foreground">Current Price: {coinData.price}</p>
                    </div>
                </div>
                
                <div className="text-left md:text-right">
                    <p className="text-sm text-gray-400 mb-1">Your Balance</p>
                    <h2 className="text-3xl font-bold text-white">{coinData.balance} {coinData.symbol}</h2>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Actions Panel */}
            <div className="lg:col-span-1">
                <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('send')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors ${
                                activeTab === 'send' 
                                    ? 'bg-primary/10 text-primary border-b-2 border-primary' 
                                    : 'text-muted-foreground hover:text-white'
                            }`}
                        >
                            Send
                        </button>
                        <button
                            onClick={() => setActiveTab('receive')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors ${
                                activeTab === 'receive' 
                                    ? 'bg-primary/10 text-primary border-b-2 border-primary' 
                                    : 'text-muted-foreground hover:text-white'
                            }`}
                        >
                            Receive
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {activeTab === 'send' ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400">Recipient Address</label>
                                    <input 
                                        value={recipientAddress}
                                        onChange={(e) => setRecipientAddress(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                                        placeholder={`Enter ${coinData.name} address`}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400">Amount</label>
                                    <div className="relative">
                                         <input 
                                            value={sendAmount}
                                            onChange={(e) => setSendAmount(e.target.value)}
                                            type="number"
                                            step="any"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                                            placeholder="0.00"
                                        />
                                        <button 
                                            onClick={setMaxAmount}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-medium hover:text-primary/80"
                                        >
                                            MAX
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">Available: {coinData.balance} {coinData.symbol}</p>
                                </div>
                                <div className="pt-4">
                                     <button 
                                        onClick={handleSend}
                                        disabled={sending || !sendAmount || !recipientAddress}
                                        className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {sending ? (
                                            <>
                                                <Loader size={18} className="animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} /> 
                                                Send {coinData.symbol}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-white p-4 rounded-xl mb-6 cursor-pointer" onClick={() => setShowQR(!showQR)}>
                                    {showQR ? (
                                        <QRCode value={coinData.address} size={120} />
                                    ) : (
                                        <QrCode size={120} className="text-black" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-400 mb-2">Your {coinData.name} Address</p>
                                <div 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={handleCopyAddress}
                                >
                                    <span className="text-xs font-mono text-white truncate">{coinData.address}</span>
                                    <Copy size={16} className="text-primary shrink-0" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-4 px-4">
                                    Only send {coinData.name} ({coinData.symbol}) to this address. Sending other assets may result in permanent loss.
                                </p>
                                <button
                                    onClick={() => setShowQR(!showQR)}
                                    className="mt-4 text-sm text-primary hover:text-primary/80"
                                >
                                    {showQR ? 'Hide QR Code' : 'Show QR Code'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* History Panel */}
            <div className="lg:col-span-2">
                <TransactionHistory coinId={id} />
            </div>
        </div>
    </DashboardLayout>
  );
};

export default CoinDetail;