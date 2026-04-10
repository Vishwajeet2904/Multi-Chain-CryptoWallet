// Fallback Bitcoin implementation without tiny-secp256k1 WASM
import * as bitcoin from 'bitcoinjs-lib';

// Simple Bitcoin address generation without ECC library
export function generateBitcoinAddress(seed) {
  try {
    // Use a simple deterministic approach for Bitcoin address generation
    // This is a fallback when ECC library fails
    const hash = new TextEncoder().encode(seed.toString());
    const addressBytes = new Uint8Array(20);
    
    // Simple hash-based address generation (not cryptographically secure for production)
    for (let i = 0; i < 20; i++) {
      addressBytes[i] = hash[i % hash.length] ^ (i * 7);
    }
    
    // Create a mock Bitcoin address format
    const addressHex = Array.from(addressBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `1${addressHex.substring(0, 25)}BTC`; // Mock format
  } catch (error) {
    console.error('Bitcoin fallback address generation failed:', error);
    return 'Bitcoin functionality not available';
  }
}

// Fallback Bitcoin balance check
export async function getBtcBalanceFallback(address) {
  if (address === 'Bitcoin functionality not available' || address.includes('BTC_NOT_AVAILABLE')) {
    return 0;
  }
  
  try {
    // For real Bitcoin addresses, still try the API
    if (address.startsWith('1') || address.startsWith('3') || address.startsWith('bc1')) {
      const response = await fetch(`https://blockchain.info/q/addressbalance/${address}`);
      if (!response.ok) throw new Error(`BTC balance fetch failed for address: ${address}`);
      const data = await response.text();
      return parseInt(data) / 100000000; // Satoshis to BTC
    }
    return 0;
  } catch (error) {
    console.error("Failed to fetch BTC balance:", error);
    return 0;
  }
}

// Fallback Bitcoin transaction (will show error message)
export async function sendBtcFallback(privateKeyWIF, toAddress, amountBTC) {
  throw new Error('Bitcoin transactions require ECC library which is not available in this browser environment. Please use a different browser or enable WebAssembly support.');
}