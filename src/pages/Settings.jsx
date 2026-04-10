import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import RecoveryGrid from '@/components/RecoveryGrid';
import { useWallet } from '@/context/WalletContext';
import { decryptData } from '@/services/crypto';
import { Shield, Globe, User, ChevronRight, AlertTriangle, Fingerprint, Lock, Eye, EyeOff, Copy } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('security');
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
  const [showPrivateKeys, setShowPrivateKeys] = useState({});
  const [passwordModal, setPasswordModal] = useState({ show: false, action: null });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { wallet, logout } = useWallet();

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'networks', label: 'Networks', icon: Globe },
  ];

  // Verify password and execute action
  const verifyPassword = async () => {
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      const encryptedWallet = localStorage.getItem('nexus_wallet');
      if (!encryptedWallet) {
        toast.error('No wallet found');
        return;
      }

      const encryptedObj = JSON.parse(encryptedWallet);
      const decryptedData = decryptData(encryptedObj, password);
      const walletData = JSON.parse(decryptedData);
      
      // Password is correct, execute the action
      if (passwordModal.action === 'showRecovery') {
        setShowRecoveryPhrase(true);
        toast.success('Recovery phrase revealed');
      } else if (passwordModal.action.startsWith('showKey_')) {
        const chain = passwordModal.action.split('_')[1];
        setShowPrivateKeys(prev => ({ ...prev, [chain]: true }));
        toast.success(`${chain} private key revealed`);
      }
      
      setPasswordModal({ show: false, action: null });
      setPassword('');
    } catch (error) {
      toast.error('Invalid password');
    } finally {
      setLoading(false);
    }
  };

  // Request password for sensitive actions
  const requestPassword = (action) => {
    setPasswordModal({ show: true, action });
  };

  // Copy to clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Get wallet data safely
  const getWalletData = () => {
    if (!wallet) return null;
    return {
      mnemonic: wallet.mnemonic?.split(' ') || [],
      ethereum: wallet.ethereum || {},
      solana: wallet.solana || {},
      bitcoin: wallet.bitcoin || {}
    };
  };

  const walletData = getWalletData();

  return (
    <DashboardLayout>
         <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

         <div className="flex flex-col lg:flex-row gap-8">
            {/* Settings Sidebar */}
            <div className="w-full lg:w-64 shrink-0 space-y-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                                activeTab === tab.id
                                    ? 'bg-white/10 text-white border border-white/10'
                                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon size={18} />
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
                {activeTab === 'security' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Section: Recovery Phrase */}
                        <div className="glass rounded-2xl p-6 border border-white/10">
                            <h2 className="text-lg font-semibold text-white mb-1">Secret Recovery Phrase</h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                Your recovery phrase is the master key to your funds. Never share it.
                            </p>
                            
                            {walletData && (
                              <RecoveryGrid 
                                phrase={walletData.mnemonic} 
                                blurred={!showRecoveryPhrase} 
                              />
                            )}
                            
                            <div className="mt-6 flex gap-4">
                                {!showRecoveryPhrase ? (
                                  <button 
                                    onClick={() => requestPassword('showRecovery')}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors flex items-center gap-2"
                                  >
                                    <Eye size={16} />
                                    Reveal Phrase
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => setShowRecoveryPhrase(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors flex items-center gap-2"
                                  >
                                    <EyeOff size={16} />
                                    Hide Phrase
                                  </button>
                                )}
                                {showRecoveryPhrase && walletData && (
                                  <button 
                                    onClick={() => copyToClipboard(walletData.mnemonic.join(' '), 'Recovery phrase')}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors flex items-center gap-2"
                                  >
                                    <Copy size={16} />
                                    Copy Phrase
                                  </button>
                                )}
                            </div>
                        </div>

                        {/* Section: Private Keys */}
                        <div className="glass rounded-2xl p-6 border border-white/10">
                             <h2 className="text-lg font-semibold text-white mb-4">Export Private Keys</h2>
                             <div className="space-y-3">
                                {walletData && [
                                  { name: 'Ethereum', key: 'ethereum', data: walletData.ethereum },
                                  { name: 'Solana', key: 'solana', data: walletData.solana },
                                  { name: 'Bitcoin', key: 'bitcoin', data: walletData.bitcoin }
                                ].map((chain) => (
                                    <div key={chain.key} className="p-3 bg-black/20 rounded-lg border border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-300 font-medium">{chain.name} Wallet</span>
                                            {!showPrivateKeys[chain.key] ? (
                                              <button 
                                                onClick={() => requestPassword(`showKey_${chain.key}`)}
                                                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                                              >
                                                <Eye size={12} />
                                                Show Key
                                              </button>
                                            ) : (
                                              <div className="flex gap-2">
                                                <button 
                                                  onClick={() => copyToClipboard(chain.data.privateKey, `${chain.name} private key`)}
                                                  className="text-xs text-green-400 hover:text-green-300 font-medium flex items-center gap-1"
                                                >
                                                  <Copy size={12} />
                                                  Copy
                                                </button>
                                                <button 
                                                  onClick={() => setShowPrivateKeys(prev => ({ ...prev, [chain.key]: false }))}
                                                  className="text-xs text-gray-400 hover:text-gray-300 font-medium flex items-center gap-1"
                                                >
                                                  <EyeOff size={12} />
                                                  Hide
                                                </button>
                                              </div>
                                            )}
                                        </div>
                                        {showPrivateKeys[chain.key] && (
                                          <div className="mt-2 p-2 bg-black/40 rounded border border-white/5">
                                            <p className="text-xs font-mono text-gray-300 break-all">
                                              {chain.data.privateKey}
                                            </p>
                                          </div>
                                        )}
                                        <div className="mt-2">
                                          <p className="text-xs text-gray-500">Address:</p>
                                          <p className="text-xs font-mono text-gray-400 break-all">
                                            {chain.data.address}
                                          </p>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                        {/* Section: Wallet Actions */}
                        <div className="glass rounded-2xl p-6 border border-white/10">
                            <h2 className="text-lg font-semibold text-white mb-4">Wallet Management</h2>
                            <div className="space-y-3">
                                <button 
                                  onClick={() => {
                                    if (confirm('Are you sure you want to lock your wallet? You will need to enter your password to unlock it again.')) {
                                      logout();
                                    }
                                  }}
                                  className="w-full p-3 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/30 rounded-lg text-sm text-yellow-200 transition-colors flex items-center gap-2"
                                >
                                  <Lock size={16} />
                                  Lock Wallet
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm('Are you sure you want to reset your wallet? This will remove all data and you will need your recovery phrase to restore it.')) {
                                      localStorage.removeItem('nexus_wallet');
                                      localStorage.removeItem('nexus_wallet_address');
                                      window.location.href = '/';
                                    }
                                  }}
                                  className="w-full p-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg text-sm text-red-200 transition-colors flex items-center gap-2"
                                >
                                  <AlertTriangle size={16} />
                                  Reset Wallet
                                </button>
                            </div>
                        </div>

                         {/* Footer Warning */}
                         <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <AlertTriangle className="text-red-500 shrink-0" size={20} />
                            <div>
                                <h4 className="text-sm font-semibold text-red-200">Security Alert</h4>
                                <p className="text-xs text-red-200/70 mt-1">
                                    NexusVault support will NEVER ask for your recovery phrase or private keys.
                                </p>
                            </div>
                         </div>
                    </div>
                )}

                {activeTab === 'networks' && (
                    <div className="glass rounded-2xl border border-white/10 overflow-hidden animate-in fade-in duration-300">
                        <div className="p-6 border-b border-white/10">
                             <h2 className="text-lg font-semibold text-white">Active Networks</h2>
                             <p className="text-sm text-muted-foreground mt-1">Manage your blockchain network connections</p>
                        </div>
                        <div className="divide-y divide-white/5">
                            {[
                                { name: 'Ethereum Mainnet', status: 'Connected', color: 'bg-green-500', rpc: 'https://go.getblock.us/...' },
                                { name: 'Solana Mainnet', status: 'Connected', color: 'bg-green-500', rpc: 'https://go.getblock.us/...' },
                                { name: 'Bitcoin Network', status: 'Connected', color: 'bg-green-500', rpc: 'blockchain.info API' }
                            ].map((net) => (
                                <div key={net.name} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <Globe size={18} className="text-muted-foreground" />
                                            <span className="text-white font-medium">{net.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${net.color}`} />
                                            <span className="text-xs text-muted-foreground">{net.status}</span>
                                        </div>
                                    </div>
                                    <div className="ml-9">
                                        <p className="text-xs text-gray-500">RPC Endpoint:</p>
                                        <p className="text-xs font-mono text-gray-400">{net.rpc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'account' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="glass rounded-2xl p-6 border border-white/10 flex items-center gap-6">
                            <div className="w-20 h-20 bg-gradient-to-tr from-primary to-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                                {walletData?.ethereum?.address?.substring(2, 4).toUpperCase() || 'A'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">NexusVault User</h2>
                                <p className="text-muted-foreground">Multi-Chain Wallet</p>
                                {walletData && (
                                  <p className="text-xs text-gray-500 mt-1 font-mono">
                                    {walletData.ethereum.address?.substring(0, 6)}...{walletData.ethereum.address?.substring(-4)}
                                  </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="glass p-6 rounded-2xl border border-white/10">
                                <Fingerprint className="text-primary mb-3" size={24} />
                                <h3 className="font-semibold text-white">Security</h3>
                                <p className="text-sm text-gray-400 mt-1">Password protected</p>
                                <p className="text-xs text-green-400 mt-2">✓ Encrypted storage</p>
                            </div>
                             <div className="glass p-6 rounded-2xl border border-white/10">
                                <Lock className="text-primary mb-3" size={24} />
                                <h3 className="font-semibold text-white">Auto-Lock</h3>
                                <p className="text-sm text-gray-400 mt-1">On browser close</p>
                                <p className="text-xs text-blue-400 mt-2">Session based</p>
                            </div>
                        </div>

                        {/* Wallet Statistics */}
                        <div className="glass rounded-2xl p-6 border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4">Wallet Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-black/20 rounded-lg">
                                    <p className="text-2xl font-bold text-white">3</p>
                                    <p className="text-sm text-gray-400">Supported Chains</p>
                                </div>
                                <div className="text-center p-4 bg-black/20 rounded-lg">
                                    <p className="text-2xl font-bold text-white">12</p>
                                    <p className="text-sm text-gray-400">Word Recovery</p>
                                </div>
                                <div className="text-center p-4 bg-black/20 rounded-lg">
                                    <p className="text-2xl font-bold text-green-400">✓</p>
                                    <p className="text-sm text-gray-400">Encrypted</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
         </div>

         {/* Password Modal */}
         {passwordModal.show && (
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
             <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
               <h3 className="text-lg font-semibold text-white mb-2">Enter Password</h3>
               <p className="text-sm text-gray-400 mb-4">
                 Please enter your wallet password to continue
               </p>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                 className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                 placeholder="Enter your password"
                 autoFocus
               />
               <div className="flex gap-3 mt-6">
                 <button
                   onClick={() => {
                     setPasswordModal({ show: false, action: null });
                     setPassword('');
                   }}
                   className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={verifyPassword}
                   disabled={loading || !password}
                   className="flex-1 px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg text-white transition-colors disabled:opacity-50"
                 >
                   {loading ? 'Verifying...' : 'Confirm'}
                 </button>
               </div>
             </div>
           </div>
         )}
    </DashboardLayout>
  );
};

export default Settings;