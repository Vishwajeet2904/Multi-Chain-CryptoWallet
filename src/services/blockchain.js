import { ethers } from 'ethers';
import { Connection, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import * as bitcoin from 'bitcoinjs-lib';
import { getBtcBalanceFallback, sendBtcFallback } from './bitcoin-fallback';

// Try to import ECC libraries with fallback
let ECPair = null;
let eccInitialized = false;

const initECC = async () => {
  try {
    // Dynamic import to handle WASM loading issues
    const ecc = await import('tiny-secp256k1');
    const { ECPairFactory } = await import('ecpair');
    
    ECPair = ECPairFactory(ecc.default || ecc);
    eccInitialized = true;
    console.log('ECC library initialized successfully');
    return true;
  } catch (error) {
    console.warn('ECC initialization failed, using fallback Bitcoin implementation:', error.message);
    eccInitialized = false;
    return false;
  }
};

// Initialize ECC on module load
initECC().catch(console.error);

// --- RPC URLs ---
// V IMPORTANT: REPLACE WITH YOUR ACTUAL GETBLOCK API KEY
const ETH_RPC_URL = 'https://go.getblock.us/81990708e37a492c89af1f1b7a82cb9a';
export const SOL_RPC_URL = 'https://go.getblock.us/bbcb5a2482ba4a86a3d1e633fcdb36fe';
const SEPOLIA_RPC_URL = 'https://ethereum-sepolia.publicnode.com'; // Public Sepolia RPC

// --- Balance Fetching ---
export async function getEthBalance(address) {
  const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

export async function getSepoliaBalance(address) {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Sepolia balance fetch failed:", error);
    return "0";
  }
}

export async function getSolBalance(address) {
  const connection = new Connection(SOL_RPC_URL);
  const publicKey = new PublicKey(address);
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

export async function getBtcBalance(address) {
  if (!eccInitialized) {
    return getBtcBalanceFallback(address);
  }
  
  try {
    const response = await fetch(`https://blockchain.info/q/addressbalance/${address}`);
    if (!response.ok) throw new Error(`BTC balance fetch failed for address: ${address}`);
    const data = await response.text();
    return parseInt(data) / 100000000; // Satoshis to BTC
  } catch (error) {
    console.error("Failed to fetch BTC balance:", error);
    return getBtcBalanceFallback(address);
  }
}

// --- Transaction Sending ---
export async function sendEth(privateKey, to, amountStr) {
  const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const tx = await wallet.sendTransaction({ to, value: ethers.parseEther(amountStr) });
  await tx.wait();
  return tx.hash;
}

export async function sendSepolia(privateKey, to, amountStr) {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const tx = await wallet.sendTransaction({ to, value: ethers.parseEther(amountStr) });
  await tx.wait();
  return tx.hash;
}

export async function sendSol(privateKey, to, amount) {
  const connection = new Connection(SOL_RPC_URL, 'confirmed');
  const fromKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  const toPublicKey = new PublicKey(to);
  
  const { blockhash } = await connection.getLatestBlockhash();
  const transaction = new Transaction({
    feePayer: fromKeypair.publicKey,
    recentBlockhash: blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: toPublicKey,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  transaction.sign(fromKeypair);
  const signature = await connection.sendRawTransaction(transaction.serialize());
  return signature;
}

export async function sendBtc(privateKeyWIF, toAddress, amountBTC) {
  // Check if ECC is initialized
  if (!eccInitialized) {
    return sendBtcFallback(privateKeyWIF, toAddress, amountBTC);
  }
  
  // Ensure ECC is initialized
  if (!ECPair) {
    const initialized = await initECC();
    if (!initialized) {
      return sendBtcFallback(privateKeyWIF, toAddress, amountBTC);
    }
  }

  const network = bitcoin.networks.bitcoin;
  const keyPair = ECPair.fromWIF(privateKeyWIF, network);
  const { address: fromAddress } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network });

  const utxoResponse = await fetch(`https://blockchain.info/unspent?active=${fromAddress}`);
  const utxoData = await utxoResponse.json();
  const utxos = utxoData.unspent_outputs;

  if (utxos.length === 0) throw new Error("No spendable outputs (UTXOs) found.");

  const psbt = new bitcoin.Psbt({ network });
  const amountSatoshis = Math.floor(amountBTC * 1e8);
  const fee = 15000; // Simplified fee
  let totalInput = 0;

  for (const utxo of utxos) {
    if (totalInput >= amountSatoshis + fee) break;
    totalInput += utxo.value;
    const txHex = await (await fetch(`https://blockchain.info/rawtx/${utxo.tx_hash_big_endian}?format=hex`)).text();
    psbt.addInput({ hash: utxo.tx_hash_big_endian, index: utxo.tx_output_n, nonWitnessUtxo: Buffer.from(txHex, 'hex') });
  }

  if (totalInput < amountSatoshis + fee) throw new Error("Insufficient funds for transaction.");

  psbt.addOutput({ address: toAddress, value: amountSatoshis });
  const change = totalInput - amountSatoshis - fee;
  if (change > 546) psbt.addOutput({ address: fromAddress, value: change }); // Don't create dust outputs

  psbt.signAllInputs(keyPair);
  psbt.finalizeAllInputs();

  const txHex = psbt.extractTransaction().toHex();
  const broadcastResponse = await fetch('https://blockchain.info/pushtx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `tx=${txHex}`
  });

  if (!broadcastResponse.ok) {
    const text = await broadcastResponse.text();
    throw new Error(`Failed to broadcast BTC transaction: ${text}`);
  }

  return psbt.extractTransaction().getId();
}

// --- Transaction History Functions ---
// Ethereum transaction history
export async function getEthTransactions(address) {
  try {
    // Using Etherscan API (mainnet) - Limited rate without a key
    const response = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`);
    const data = await response.json();
    
    if (data.status === "1" && Array.isArray(data.result)) {
      return data.result.slice(0, 10).map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        timestamp: parseInt(tx.timeStamp) * 1000,
        type: tx.from.toLowerCase() === address.toLowerCase() ? "Sent" : "Received",
        status: "Confirmed"
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch ETH transactions:", error);
    return [];
  }
}

// Sepolia transaction history
export async function getSepoliaTransactions(address) {
  try {
    // Switching to Blockscout for Sepolia as it's more reliable for public no-key requests
    const response = await fetch(`https://eth-sepolia.blockscout.com/api?module=account&action=txlist&address=${address}&sort=desc`);
    const data = await response.json();
    
    if (data.status === "1" && Array.isArray(data.result)) {
      return data.result.slice(0, 10).map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        timestamp: parseInt(tx.timeStamp) * 1000,
        type: tx.from.toLowerCase() === address.toLowerCase() ? "Sent" : "Received",
        status: "Confirmed"
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch Sepolia transactions from blockscout:", error);
    return [];
  }
}

// Solana transaction history
export async function getSolTransactions(address) {
  try {
    const connection = new Connection(SOL_RPC_URL);
    const publicKey = new PublicKey(address);
    
    // Get signatures
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });
    
    // Get transaction details for each signature
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });
          
          if (!tx) return null;
          
          // Find transfer instruction
          let amount = 0;
          let toAddress = "";
          const instructions = tx.transaction.message.compiledInstructions;
          
          for (const instruction of instructions) {
            if (instruction.programIdIndex === 0) { // System Program
              // Simplified - actual parsing would be more complex
              amount = 0; // Would need to parse lamports
            }
          }

          return {
            hash: sig.signature,
            from: address,
            to: toAddress || "Unknown",
            value: amount / LAMPORTS_PER_SOL,
            timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
            type: sig.err ? "Failed" : "Confirmed",
            status: sig.err ? "Failed" : "Confirmed"
          };
        } catch {
          return null;
        }
      })
    );

    return transactions.filter(tx => tx !== null);
  } catch (error) {
    console.error("Failed to fetch SOL transactions:", error);
    return [];
  }
}

// Bitcoin transaction history
export async function getBtcTransactions(address) {
  try {
    const response = await fetch(`https://blockchain.info/rawaddr/${address}?limit=10`);
    const data = await response.json();
    
    return data.txs.map(tx => {
      // Find if address is sender or receiver
      const isSender = tx.inputs.some(input => input.prev_out && input.prev_out.addr === address);
      
      // Calculate amount for this address
      let amount = 0;
      if (isSender) {
        // Sum outputs to others
        amount = tx.out.reduce((sum, output) => {
          if (output.addr !== address) return sum + output.value;
          return sum;
        }, 0) / 100000000;
      } else {
        // Sum outputs to this address
        amount = tx.out.reduce((sum, output) => {
          if (output.addr === address) return sum + output.value;
          return sum;
        }, 0) / 100000000;
      }

      return {
        hash: tx.hash,
        from: isSender ? address : tx.inputs[0]?.prev_out?.addr || "Unknown",
        to: isSender ? tx.out.find(o => o.addr !== address)?.addr || "Unknown" : address,
        value: amount,
        timestamp: tx.time * 1000,
        type: isSender ? "Sent" : "Received",
        status: "Confirmed"
      };
    });
  } catch (error) {
    console.error("Failed to fetch BTC transactions:", error);
    return [];
  }
}