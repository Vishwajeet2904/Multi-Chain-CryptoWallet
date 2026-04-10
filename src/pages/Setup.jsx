import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { generateMnemonic } from '../services/wallet-simple';

function Setup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [newMnemonic, setNewMnemonic] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, unlock, hasWallet, loading } = useWallet();

  // Check if user already has wallet and redirect to unlock
  if (hasWallet() && step === 'password') {
    return <UnlockWallet />;
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setStep('seed');
  };

  const handleImport = async (e) => {
    e.preventDefault();
    const words = mnemonic.trim().split(/\s+/);
    
    if (words.length !== 12) {
      setError('Please enter exactly 12 words');
      return;
    }

    try {
      setError('');
      await login(mnemonic.trim(), password);
      navigate('/dashboard');
    } catch {
      setError('Invalid mnemonic phrase or wrong password');
    }
  };

  const handleCreate = () => {
    setNewMnemonic(generateMnemonic());
    setStep('newSeed');
  };

  const proceedWithNewMnemonic = async () => {
    try {
      await login(newMnemonic, password);
      navigate('/dashboard');
    } catch {
      setError('Failed to create wallet. Please try again.');
    }
  };

  const goBack = () => {
    setStep('password');
    setPassword('');
    setConfirmPassword('');
    setMnemonic('');
    setNewMnemonic('');
    setError('');
  };

  // Unlock existing wallet component
  function UnlockWallet() {
    const [unlockPassword, setUnlockPassword] = useState('');
    const [unlockError, setUnlockError] = useState('');
    const [showUnlockPassword, setShowUnlockPassword] = useState(false);

    const handleUnlock = async (e) => {
      e.preventDefault();
      try {
        setUnlockError('');
        await unlock(unlockPassword);
        navigate('/dashboard');
      } catch {
        setUnlockError('Invalid password');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Welcome Back</h1>
            <p className="text-gray-400 text-lg">Enter your password to unlock your wallet</p>
          </div>

          <div className="glass rounded-3xl border border-white/10 p-8">
            <form onSubmit={handleUnlock} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input
                    type={showUnlockPassword ? "text" : "password"}
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    className="w-full px-5 py-4 text-lg bg-black/40 border-2 border-white/10 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all text-white placeholder-gray-500"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-300"
                  >
                    {showUnlockPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {unlockError && (
                <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <p className="text-sm text-red-300">{unlockError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white font-bold text-lg py-5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Unlocking...' : 'Unlock Wallet'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  localStorage.removeItem('nexus_wallet');
                  window.location.reload();
                }}
                className="text-sm text-gray-400 hover:text-gray-300"
              >
                Import Different Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Password Step
  if (step === 'password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Logo/Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">NexusVault</h1>
            <p className="text-gray-400 text-lg">Create a strong password to protect your wallet</p>
          </div>

          {/* Main Card */}
          <div className="glass rounded-3xl border border-white/10 p-8 md:p-10">
            <h2 className="text-2xl font-bold text-white mb-2">Set Your Password</h2>
            <p className="text-gray-400 mb-8">Your password encrypts your wallet locally</p>

            <form onSubmit={handlePasswordSubmit} className="space-y-8">
              {/* Password Input */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 text-lg bg-black/40 border-2 border-white/10 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all text-white placeholder-gray-500"
                    placeholder="Minimum 8 characters with uppercase & number"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <div className={`w-full h-2 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                  <span className="ml-3">{password.length >= 8 ? '✓ Length OK' : '8+ characters'}</span>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-4 text-lg bg-black/40 border-2 border-white/10 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all text-white placeholder-gray-500"
                  placeholder="Re-enter your password"
                  required
                />
                {confirmPassword && (
                  <div className={`flex items-center text-sm ${password === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white font-bold text-lg py-5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Continue to Wallet Setup'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // New Seed Phrase Step
  if (step === 'newSeed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <button onClick={goBack} className="flex items-center text-gray-400 hover:text-white mb-8 text-lg font-medium">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Password
          </button>

          <div className="glass rounded-3xl border border-white/10 overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-primary to-blue-600 px-10 py-12 text-white">
              <h1 className="text-4xl font-bold mb-4">Save Your Recovery Phrase</h1>
              <p className="text-blue-100 text-xl">This is the most important step in securing your wallet</p>
            </div>

            {/* Mnemonic Display */}
            <div className="px-10 py-10">
              <h2 className="text-2xl font-bold text-white mb-8 text-center">Write These Words Down</h2>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-10">
                {newMnemonic.split(' ').map((word, index) => (
                  <div key={index} className="bg-black/40 border-2 border-white/10 rounded-xl p-5 text-center hover:border-primary/50 transition-colors">
                    <div className="text-sm text-gray-400 font-medium mb-2">Word #{index + 1}</div>
                    <div className="text-xl font-bold text-white font-mono">{word}</div>
                  </div>
                ))}
              </div>

              {/* Copy Button */}
              <div className="flex justify-center mb-8">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newMnemonic);
                    alert('Recovery phrase copied to clipboard!');
                  }}
                  className="inline-flex items-center px-6 py-3 border-2 border-white/20 rounded-xl text-gray-300 font-medium hover:border-white/40 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy to Clipboard
                </button>
              </div>

              {/* Continue Button */}
              <button
                onClick={proceedWithNewMnemonic}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold text-xl py-5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Creating Wallet...' : "✅ I've Securely Saved My Phrase, Continue to Wallet"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Import Seed Phrase Step
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <button onClick={goBack} className="flex items-center text-gray-400 hover:text-white mb-8 text-lg font-medium">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Password
        </button>

        <div className="glass rounded-3xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-10 py-12 text-white">
            <h1 className="text-4xl font-bold mb-4">Import Existing Wallet</h1>
            <p className="text-purple-100 text-xl">Restore your wallet using your 12-word recovery phrase</p>
          </div>

          <div className="md:flex">
            {/* Left Column - Form */}
            <div className="md:w-2/3 p-10 border-r border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Enter Recovery Phrase</h2>
              
              <div className="mb-8">
                <textarea
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  className="w-full h-64 px-5 py-4 text-lg bg-black/40 border-2 border-white/10 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 font-mono resize-none transition-all text-white placeholder-gray-500"
                  placeholder="Enter your 12-word recovery phrase exactly as you saved it, with words separated by spaces"
                  rows="6"
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="text-sm text-gray-400">
                    Words entered: <span className="font-bold text-white">{mnemonic.trim().split(/\s+/).filter(w => w).length} / 12</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMnemonic('')}
                    className="text-sm text-gray-400 hover:text-gray-300"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border-l-4 border-red-500 p-5 rounded-r-lg mb-6">
                  <p className="text-red-300 font-medium">Import Error</p>
                  <p className="text-red-400 mt-1">{error}</p>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={mnemonic.trim().split(/\s+/).length !== 12 || loading}
                className={`w-full py-5 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                  mnemonic.trim().split(/\s+/).length !== 12 || loading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? 'Importing...' : '🔓 Import My Wallet'}
              </button>
            </div>

            {/* Right Column - Info */}
            <div className="md:w-1/3 p-10 bg-black/20">
              <div className="space-y-8">
                {/* New User Section */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">🚀 New User?</h3>
                  <p className="text-gray-400 mb-6">Don't have a wallet yet? Create a new secure wallet in just a few steps.</p>
                  <button
                    onClick={handleCreate}
                    className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-bold py-4 px-6 rounded-xl shadow transition-all"
                  >
                    Create New Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setup;