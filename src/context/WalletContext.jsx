import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateMnemonic, createWalletFromMnemonic } from '../services/wallet-simple';
import { encryptData, decryptData } from '../services/crypto';
import { getEthBalance, getSolBalance, getBtcBalance, getSepoliaBalance } from '../services/blockchain';
import { getLivePrices } from '../services/prices';
import { toast } from 'sonner';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState({
    ethereum: 0,
    solana: 0,
    bitcoin: 0,
    sepolia: 0
  });
  const [prices, setPrices] = useState({
    ethereum: { usd: 2500, change: 0 },
    solana: { usd: 100, change: 0 },
    bitcoin: { usd: 45000, change: 0 },
    sepolia: { usd: 0.001, change: 0 } // Mock placeholder price for testnet
  });
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);

  const loadPrices = useCallback(async () => {
    try {
      setPriceLoading(true);
      const livePrices = await getLivePrices();
      setPrices({
        ...livePrices,
        sepolia: { usd: 0.001, change: 0 }
      });
    } catch (error) {
      console.error('Failed to load prices:', error);
    } finally {
      setPriceLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const encryptedWallet = localStorage.getItem('nexus_wallet');
        if (encryptedWallet) {
          // User has a wallet but needs to login with password
          setLoading(false);
          await loadPrices();
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
      setLoading(false);
      await loadPrices();
    };

    checkAuth();

    // Refresh prices every 60 seconds
    const priceInterval = setInterval(loadPrices, 60000);
    return () => clearInterval(priceInterval);
  }, [loadPrices]);

  const login = async (mnemonic, password) => {
    try {
      setLoading(true);
      
      // Create wallet from mnemonic
      const walletData = await createWalletFromMnemonic(mnemonic);
      
      // Encrypt and store wallet
      const encryptedWallet = encryptData(JSON.stringify(walletData), password);
      localStorage.setItem('nexus_wallet', JSON.stringify(encryptedWallet));
      localStorage.setItem('nexus_wallet_address', walletData.solana.address);
      
      setWallet(walletData);
      setIsAuthenticated(true);
      
      // Load balances and prices
      await Promise.all([
        loadBalances(walletData),
        loadPrices()
      ]);
      
      toast.success('Wallet created successfully!');
      return walletData;
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Failed to create wallet. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unlock = async (password) => {
    try {
      setLoading(true);
      
      const encryptedWallet = localStorage.getItem('nexus_wallet');
      if (!encryptedWallet) {
        throw new Error('No wallet found');
      }

      const encryptedObj = JSON.parse(encryptedWallet);
      const decryptedData = decryptData(encryptedObj, password);
      const walletData = JSON.parse(decryptedData);
      
      setWallet(walletData);
      setIsAuthenticated(true);
      
      // Load balances and prices
      await Promise.all([
        loadBalances(walletData),
        loadPrices()
      ]);
      
      toast.success('Wallet unlocked successfully!');
      return walletData;
    } catch (error) {
      console.error('Unlock failed:', error);
      toast.error('Invalid password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadBalances = async (walletData) => {
    try {
      setBalanceLoading(true);
      
      const [ethBalance, solBalance, btcBalance, sepBalance] = await Promise.all([
        getEthBalance(walletData.ethereum.address).catch(() => 0),
        getSolBalance(walletData.solana.address).catch(() => 0),
        getBtcBalance(walletData.bitcoin.address).catch(() => 0),
        getSepoliaBalance(walletData.ethereum.address).catch(() => 0)
      ]);

      setBalances({
        ethereum: parseFloat(ethBalance),
        solana: parseFloat(solBalance),
        bitcoin: parseFloat(btcBalance),
        sepolia: parseFloat(sepBalance)
      });
    } catch (error) {
      console.error('Failed to load balances:', error);
      toast.error('Failed to load balances');
    } finally {
      setBalanceLoading(false);
    }
  };

  const refreshBalances = async () => {
    if (wallet) {
      await Promise.all([
        loadBalances(wallet),
        loadPrices()
      ]);
    }
  };

  const logout = () => {
    setWallet(null);
    setIsAuthenticated(false);
    setBalances({ ethereum: 0, solana: 0, bitcoin: 0, sepolia: 0 });
    // Don't remove wallet from localStorage, just clear session
    toast.success('Logged out successfully');
  };

  const hasWallet = () => {
    return !!localStorage.getItem('nexus_wallet');
  };

  const getTotalBalance = () => {
    return (
      balances.ethereum * prices.ethereum.usd +
      balances.solana * prices.solana.usd +
      balances.bitcoin * prices.bitcoin.usd
    );
  };

  const value = {
    isAuthenticated,
    wallet,
    balances,
    prices,
    loading,
    balanceLoading,
    priceLoading,
    login,
    unlock,
    logout,
    hasWallet,
    refreshBalances,
    getTotalBalance
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};