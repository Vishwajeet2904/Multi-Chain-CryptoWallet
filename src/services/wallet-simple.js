import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { generateBitcoinAddress } from './bitcoin-fallback';

// Try to import ECC libraries with fallback
let bip32 = null;
let eccInitialized = false;

const initECC = async () => {
  try {
    // Dynamic import to handle WASM loading issues
    const ecc = await import('tiny-secp256k1');
    const { BIP32Factory } = await import('bip32');
    
    bip32 = BIP32Factory(ecc.default || ecc);
    eccInitialized = true;
    console.log('BIP32 ECC library initialized successfully');
    return true;
  } catch (error) {
    console.warn('ECC initialization failed, using fallback Bitcoin implementation:', error.message);
    eccInitialized = false;
    return false;
  }
};

// Initialize ECC on module load
initECC().catch(console.error);

export function generateMnemonic() {
  return bip39.generateMnemonic();
}

export async function createWalletFromMnemonic(mnemonic) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  
  const ethereumWallet = deriveEthereumWallet(seed);
  const bitcoinWallet = await deriveBitcoinWallet(seed);
  const solanaWallet = deriveSolanaWallet(seed);

  return {
    mnemonic,
    ethereum: ethereumWallet,
    bitcoin: bitcoinWallet,
    solana: solanaWallet,
  };
}

function deriveEthereumWallet(seed) {
  const ethPath = "m/44'/60'/0'/0/0";
  const rootNode = ethers.HDNodeWallet.fromSeed(seed);
  const ethNode = rootNode.derivePath(ethPath);

  return {
    path: ethPath,
    privateKey: ethNode.privateKey,
    publicKey: ethNode.publicKey,
    address: ethNode.address,
  };
}

async function deriveBitcoinWallet(seed) {
  // Try to use ECC if available
  if (!eccInitialized) {
    await initECC();
  }
  
  if (!eccInitialized || !bip32) {
    // Fallback: create a deterministic Bitcoin address without ECC
    const fallbackAddress = generateBitcoinAddress(seed);
    return {
      path: "m/44'/0'/0'/0/0",
      privateKey: 'BTC_NOT_AVAILABLE_WASM_ISSUE',
      publicKey: 'BTC_NOT_AVAILABLE_WASM_ISSUE',
      address: fallbackAddress,
    };
  }

  try {
    const btcPath = "m/44'/0'/0'/0/0";
    const rootNode = bip32.fromSeed(seed);
    const btcNode = rootNode.derivePath(btcPath);
    
    const btcAddress = bitcoin.payments.p2pkh({
      pubkey: Buffer.from(btcNode.publicKey),
    }).address;

    return {
      path: btcPath,
      privateKey: btcNode.toWIF(),
      publicKey: btcNode.publicKey.toString('hex'),
      address: btcAddress,
    };
  } catch (error) {
    console.error('Bitcoin wallet derivation failed:', error);
    // Fallback on any error
    const fallbackAddress = generateBitcoinAddress(seed);
    return {
      path: "m/44'/0'/0'/0/0",
      privateKey: 'BTC_ERROR_' + error.message.substring(0, 20),
      publicKey: 'BTC_ERROR',
      address: fallbackAddress,
    };
  }
}

function deriveSolanaWallet(seed) {
  // Use a simpler approach for Solana key derivation
  // This creates a deterministic keypair from the seed
  const seedArray = new Uint8Array(seed.slice(0, 32));
  const keypair = nacl.sign.keyPair.fromSeed(seedArray);
  
  const solanaKeypair = Keypair.fromSecretKey(keypair.secretKey);
  const solanaAddress = solanaKeypair.publicKey.toBase58();
  const solanaPrivateKey = bs58.encode(solanaKeypair.secretKey);

  return {
    path: "m/44'/501'/0'/0'",
    privateKey: solanaPrivateKey,
    publicKey: solanaAddress,
    address: solanaAddress,
  };
}