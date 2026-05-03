# NexusVault — Multi-Chain Crypto Wallet

NexusVault is a fully client-side, browser-based multi-chain cryptocurrency wallet built with React. It supports Ethereum, Solana, Bitcoin, and the Ethereum Sepolia testnet. There is no backend server, no database, and no cloud storage — everything runs entirely in the user's browser using cryptographic standards and direct blockchain RPC connections.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Application Flow](#application-flow)
5. [Wallet Generation — How It Works](#wallet-generation--how-it-works)
6. [Encryption & Local Storage (The "Database")](#encryption--local-storage-the-database)
7. [Blockchain Connectivity](#blockchain-connectivity)
8. [Price Data](#price-data)
9. [Transaction History](#transaction-history)
10. [Sending Transactions](#sending-transactions)
11. [State Management](#state-management)
12. [UI Layer](#ui-layer)
13. [Build System & Polyfills](#build-system--polyfills)
14. [Security Model](#security-model)
15. [Running the Project](#running-the-project)

---

## Project Overview

NexusVault is a non-custodial HD (Hierarchical Deterministic) wallet. "Non-custodial" means the app never sends your private keys or seed phrase to any server — they never leave your device. "HD wallet" means a single 12-word seed phrase deterministically generates all your wallet addresses across every supported blockchain using industry-standard BIP-39 and BIP-44 derivation paths.

**Supported chains:**
- Ethereum Mainnet (ETH)
- Solana Mainnet (SOL)
- Bitcoin Mainnet (BTC)
- Ethereum Sepolia Testnet (SEP) — for testing without real funds

---

## Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| UI Framework | React 19 | Component-based UI |
| Build Tool | Vite 7 | Fast dev server and bundler |
| Routing | React Router DOM v7 | Client-side page navigation |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| UI Components | Radix UI + shadcn/ui | Accessible, headless UI primitives |
| State Management | React Context API | Global wallet state |
| Server State | TanStack React Query | Async data fetching and caching |
| Notifications | Sonner | Toast notifications |
| Icons | Lucide React | SVG icon library |
| Mnemonic Generation | bip39 | BIP-39 seed phrase standard |
| Ethereum HD Wallet | ethers.js v6 | ETH key derivation, signing, RPC |
| Bitcoin HD Wallet | bip32 + bitcoinjs-lib | BTC key derivation and PSBT signing |
| Bitcoin Key Pairs | ecpair + tiny-secp256k1 | Elliptic curve cryptography (WASM) |
| Solana Wallet | @solana/web3.js | SOL key derivation and transactions |
| Solana Key Derivation | tweetnacl | NaCl cryptography for Solana keypairs |
| Key Encoding | bs58 | Base58 encoding for Solana keys |
| HD Path for Solana | ed25519-hd-key | Ed25519 HD key derivation |
| Encryption | crypto-js | AES-256-CBC + PBKDF2 for local storage |
| QR Codes | react-qr-code | Receive address QR display |
| Node Polyfills | vite-plugin-node-polyfills | Buffer, crypto, stream in browser |
| WASM Support | vite-plugin-wasm + vite-plugin-top-level-await | WebAssembly for secp256k1 |
| Charts | Recharts | Data visualization |
| Forms | React Hook Form + Zod | Form handling and validation |

---

## Project Structure

```
src/
├── main.jsx                  # App entry point, mounts React root
├── App.jsx                   # Root component, providers, router
├── index.css                 # Global styles
│
├── pages/
│   ├── Setup.jsx             # Wallet creation / import / unlock screen
│   ├── Dashboard.jsx         # Main portfolio overview
│   ├── CoinDetail.jsx        # Per-coin send/receive/history page
│   ├── Settings.jsx          # Security, networks, account settings
│   └── NotFound.jsx          # 404 page
│
├── components/
│   ├── DashboardLayout.jsx   # Sidebar + main layout wrapper
│   ├── AssetCard.jsx         # Individual coin card with balance
│   ├── TransactionHistory.jsx# Live transaction list from blockchain
│   ├── RecoveryGrid.jsx      # 12-word seed phrase display grid
│   └── ui/                   # shadcn/ui component library (button, dialog, etc.)
│
├── context/
│   └── WalletContext.jsx     # Global state: wallet, balances, prices, auth
│
├── services/
│   ├── wallet-simple.js      # HD wallet derivation (primary, with ECC fallback)
│   ├── wallet.js             # Alternative wallet derivation (full ECC required)
│   ├── blockchain.js         # All blockchain RPC calls (balances, send, history)
│   ├── crypto.js             # AES encryption/decryption for local storage
│   ├── prices.js             # CoinGecko live price fetching
│   ├── bitcoin-fallback.js   # Bitcoin address generation without WASM
│   └── walletService.js      # (reserved, currently empty)
│
├── hooks/
│   └── use-mobile.js         # Responsive breakpoint hook
│
└── lib/
    └── utils.js              # Tailwind class merging utility (cn)
```

---

## Application Flow

Here is the complete user journey from first visit to sending a transaction:

### Step 1 — First Visit: Setup Page (`/`)

When a user opens the app for the first time, `App.jsx` renders the `Setup` page at route `/`. The `Setup` component checks `localStorage` for a key called `nexus_wallet`. If nothing is found, it walks the user through a 3-step onboarding flow:

**Step 1a — Set Password**
The user creates a password with enforced rules: minimum 8 characters, at least one uppercase letter, at least one number. This password is never stored anywhere. It is only used as the encryption key for the wallet data.

**Step 1b — Create or Import Wallet**
- **Create new wallet:** `generateMnemonic()` from `bip39` is called, which uses the BIP-39 wordlist to generate a cryptographically random 12-word mnemonic phrase. The words are displayed in a grid and the user is instructed to write them down.
- **Import existing wallet:** The user pastes their existing 12-word phrase. The app validates it has exactly 12 words before proceeding.

**Step 1c — Wallet is Created and Encrypted**
`createWalletFromMnemonic(mnemonic)` is called, which derives all three wallet addresses from the seed. The resulting wallet object (containing addresses, public keys, and private keys) is serialized to JSON, encrypted with AES-256-CBC using the user's password, and saved to `localStorage` under the key `nexus_wallet`. The user is then redirected to `/dashboard`.

### Step 2 — Returning Visit: Unlock Screen

If `nexus_wallet` exists in `localStorage`, the `Setup` page renders the `UnlockWallet` sub-component instead. The user enters their password, which is used to decrypt the stored wallet data. If decryption succeeds, the wallet is loaded into memory and the user is sent to `/dashboard`. If the password is wrong, `decryptData()` throws and an error is shown.

### Step 3 — Dashboard (`/dashboard`)

The dashboard is protected — if `isAuthenticated` is false, `useEffect` redirects back to `/`. Once authenticated, the dashboard shows:
- Total portfolio value in USD (sum of all coin balances × live prices)
- All three wallet addresses with copy buttons
- Asset cards for ETH, SOL, BTC, and SEP with live balances and 24h price changes
- Recent transaction history pulled live from blockchain explorers

### Step 4 — Coin Detail (`/coin/:id`)

Clicking any asset card navigates to `/coin/ethereum`, `/coin/solana`, etc. This page shows:
- Current balance and price for that specific coin
- A **Send** tab: enter recipient address and amount, click Send to broadcast a real transaction
- A **Receive** tab: shows your address and a QR code
- Transaction history specific to that coin

### Step 5 — Settings (`/settings`)

Three tabs:
- **Account:** Shows wallet info, security status, supported chain count
- **Security:** Reveal/hide the 12-word recovery phrase (requires password re-entry), export private keys per chain (requires password), lock wallet, or reset wallet entirely
- **Networks:** Shows the RPC endpoints currently connected for each chain

---

## Wallet Generation — How It Works

This is the core cryptographic engine of the app, living in `src/services/wallet-simple.js`.

### The Seed

Everything starts with the mnemonic phrase. `bip39.mnemonicToSeed(mnemonic)` converts the 12 words into a 512-bit (64-byte) binary seed using PBKDF2-HMAC-SHA512 with 2048 iterations. This seed is the root of all derived keys.

### Ethereum Derivation

```
Derivation Path: m/44'/60'/0'/0/0
```

`ethers.HDNodeWallet.fromSeed(seed)` creates a BIP-32 HD wallet root node. `.derivePath("m/44'/60'/0'/0/0")` traverses the tree to the standard Ethereum account path. This gives us:
- `privateKey` — 32-byte hex string, used to sign transactions
- `publicKey` — 33-byte compressed public key
- `address` — the familiar `0x...` Ethereum address (derived by hashing the public key with Keccak-256)

The same Ethereum address and private key are reused for the Sepolia testnet since Sepolia is just Ethereum on a different network ID.

### Bitcoin Derivation

```
Derivation Path: m/44'/0'/0'/0/0
```

`bip32.fromSeed(seed)` creates a BIP-32 root node using the `tiny-secp256k1` WASM library for elliptic curve operations on the secp256k1 curve. `.derivePath("m/44'/0'/0'/0/0")` reaches the standard Bitcoin account. `bitcoin.payments.p2pkh({ pubkey: btcNode.publicKey })` generates a legacy P2PKH address (starts with `1`). The private key is exported in WIF (Wallet Import Format) for use in transaction signing.

Because `tiny-secp256k1` is a WebAssembly module, it can fail to load in some browser environments. The app handles this gracefully with a fallback in `bitcoin-fallback.js` that generates a deterministic (but non-standard) address from the seed bytes when WASM is unavailable.

### Solana Derivation

```
Derivation Path: m/44'/501'/0'/0'
```

Solana uses the Ed25519 elliptic curve, not secp256k1. The app takes the first 32 bytes of the seed and passes them directly to `nacl.sign.keyPair.fromSeed(seedArray)` from the `tweetnacl` library. This creates an Ed25519 keypair. `Keypair.fromSecretKey(keypair.secretKey)` wraps it in a Solana-compatible keypair. The public key is Base58-encoded to produce the familiar Solana address format.

---

## Encryption & Local Storage (The "Database")

NexusVault has no traditional database. The only persistent storage is the browser's `localStorage`. Here is exactly what gets stored and how it is protected.

### What is stored

| Key | Value |
|---|---|
| `nexus_wallet` | JSON object containing `{ salt, iv, encryptedData }` |
| `nexus_wallet_address` | Plain text Solana address (non-sensitive, used for display) |

### How encryption works (`src/services/crypto.js`)

The encryption uses `crypto-js` and follows this process:

1. **Key Derivation:** The user's password is never used directly as an encryption key. Instead, `CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 })` derives a 256-bit key. A random 128-bit salt is generated fresh every time the wallet is saved, so the derived key is different even if the same password is used twice.

2. **Encryption:** `CryptoJS.AES.encrypt(data, key, { iv, padding: Pkcs7, mode: CBC })` encrypts the wallet JSON using AES-256-CBC. A random 128-bit IV (Initialization Vector) is generated for each encryption operation.

3. **Storage:** The salt, IV, and ciphertext are all stored together in `localStorage`. Without the correct password, the salt and IV are useless — you cannot reconstruct the key.

4. **Decryption:** On unlock, the same PBKDF2 process is run with the stored salt and the entered password to reconstruct the key. If the password is wrong, the decrypted output is garbage and `JSON.parse()` throws an error, which the app catches and shows as "Invalid password."

The wallet data (including private keys and the mnemonic) only ever exists in plaintext in JavaScript memory during an active session. It is never written to disk in plaintext.

---

## Blockchain Connectivity

All blockchain communication happens in `src/services/blockchain.js`. The app connects directly to blockchain nodes via RPC — no intermediary backend.

### Ethereum & Sepolia

Uses `ethers.JsonRpcProvider` from `ethers.js v6`.

- **Ethereum Mainnet RPC:** `https://go.getblock.us/81990708e37a492c89af1f1b7a82cb9a` (GetBlock.io hosted node)
- **Sepolia Testnet RPC:** `https://ethereum-sepolia.publicnode.com` (public node, no key required)

**Balance fetch:**
```js
const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
const balance = await provider.getBalance(address); // returns BigInt in wei
ethers.formatEther(balance); // converts to ETH string
```

**Sending ETH:**
```js
const wallet = new ethers.Wallet(privateKey, provider);
const tx = await wallet.sendTransaction({ to, value: ethers.parseEther(amountStr) });
await tx.wait(); // waits for 1 confirmation
```

### Solana

Uses `@solana/web3.js` with a `Connection` object.

- **Solana Mainnet RPC:** `https://go.getblock.us/bbcb5a2482ba4a86a3d1e633fcdb36fe` (GetBlock.io hosted node)

**Balance fetch:**
```js
const connection = new Connection(SOL_RPC_URL);
const balance = await connection.getBalance(new PublicKey(address)); // returns lamports
balance / LAMPORTS_PER_SOL; // 1 SOL = 1,000,000,000 lamports
```

**Sending SOL:**
The app builds a `Transaction` with a `SystemProgram.transfer` instruction, fetches the latest blockhash (required for transaction validity), signs it with the keypair reconstructed from the stored private key, and broadcasts it via `connection.sendRawTransaction()`.

### Bitcoin

Bitcoin has no single RPC standard for browser use, so the app uses the public **Blockchain.info REST API**:

- Balance: `GET https://blockchain.info/q/addressbalance/{address}` — returns satoshis as plain text
- UTXOs: `GET https://blockchain.info/unspent?active={address}` — returns unspent outputs for building transactions
- Raw TX: `GET https://blockchain.info/rawtx/{txHash}?format=hex` — fetches raw transaction hex for PSBT inputs
- Broadcast: `POST https://blockchain.info/pushtx` — broadcasts signed transaction hex

**Sending BTC** uses the PSBT (Partially Signed Bitcoin Transaction) standard from `bitcoinjs-lib`:
1. Fetch UTXOs for the sender address
2. Select enough UTXOs to cover amount + fee (hardcoded 15,000 satoshis)
3. Build a `Psbt` object, add inputs and outputs
4. Sign all inputs with `ECPair.fromWIF(privateKeyWIF)`
5. Finalize and extract the raw transaction hex
6. Broadcast to the network

---

## Price Data

Live prices come from the **CoinGecko public API** in `src/services/prices.js`:

```
GET https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,bitcoin&vs_currencies=usd&include_24hr_change=true
```

This returns current USD prices and 24-hour percentage change for ETH, SOL, and BTC. No API key is required for this endpoint (subject to rate limits).

Prices are fetched on app load and then refreshed automatically every 60 seconds via `setInterval` in `WalletContext`. If the API call fails, the app falls back to hardcoded placeholder prices (`ETH: $2500, SOL: $100, BTC: $45000`) so the UI never breaks.

Sepolia testnet ETH is given a mock price of `$0.001` since it has no real market value.

---

## Transaction History

Transaction history is fetched live from blockchain explorers in `src/services/blockchain.js`. Each chain uses a different data source:

| Chain | API Used |
|---|---|
| Ethereum | Etherscan API (`api.etherscan.io`) — public endpoint, rate limited without key |
| Sepolia | Blockscout API (`eth-sepolia.blockscout.com`) — more reliable for public use |
| Solana | `connection.getSignaturesForAddress()` via `@solana/web3.js` RPC |
| Bitcoin | Blockchain.info REST API (`blockchain.info/rawaddr/{address}`) |

The `TransactionHistory` component fetches transactions on mount. On the main dashboard it loads all four chains in parallel with `Promise.all()`, merges the results, sorts by timestamp descending, and shows the 10 most recent. On the coin detail page it only fetches the relevant chain.

Each transaction entry links to the appropriate block explorer:
- ETH → `etherscan.io/tx/{hash}`
- SEP → `sepolia.etherscan.io/tx/{hash}`
- SOL → `explorer.solana.com/tx/{hash}`
- BTC → `blockchain.info/tx/{hash}`

---

## Sending Transactions

The `CoinDetail` page handles sending. When the user fills in a recipient address and amount and clicks Send:

1. Basic validation runs (non-empty fields, amount > 0, amount ≤ balance)
2. The appropriate send function is called from `blockchain.js` based on the coin ID from the URL param
3. The private key used for signing is pulled directly from the in-memory `wallet` object in `WalletContext` — it is never read from `localStorage` at this point
4. On success, a toast shows the transaction hash (truncated)
5. `refreshBalances()` is called after a 2-second delay to give the network time to process

---

## State Management

All global state lives in `src/context/WalletContext.jsx`, implemented with React's built-in `createContext` and `useState`. There is no Redux or Zustand.

The context exposes:

| Value | Type | Description |
|---|---|---|
| `isAuthenticated` | boolean | Whether the wallet is currently unlocked |
| `wallet` | object | In-memory wallet data (addresses, keys, mnemonic) |
| `balances` | object | Live balances for ETH, SOL, BTC, SEP |
| `prices` | object | Live USD prices and 24h change per coin |
| `loading` | boolean | Auth/unlock loading state |
| `balanceLoading` | boolean | Balance fetch loading state |
| `priceLoading` | boolean | Price fetch loading state |
| `login(mnemonic, password)` | function | Create wallet from mnemonic, encrypt, store |
| `unlock(password)` | function | Decrypt stored wallet with password |
| `logout()` | function | Clear in-memory state (does NOT delete localStorage) |
| `hasWallet()` | function | Check if encrypted wallet exists in localStorage |
| `refreshBalances()` | function | Re-fetch all balances and prices |
| `getTotalBalance()` | function | Calculate total USD portfolio value |

`TanStack React Query` is set up at the root level via `QueryClientProvider` but is available for any future data-fetching needs that benefit from caching and background refetching.

---

## UI Layer

### Routing

`react-router-dom v7` handles client-side routing with four routes:

| Route | Component | Access |
|---|---|---|
| `/` | `Setup` | Public |
| `/dashboard` | `Dashboard` | Requires `isAuthenticated` |
| `/coin/:id` | `CoinDetail` | Requires `isAuthenticated` |
| `/settings` | `Settings` | Requires `isAuthenticated` |

### Layout

`DashboardLayout` wraps all authenticated pages. It renders a fixed sidebar on desktop with navigation links (Dashboard, Settings) and a sticky top header on mobile. The main content area scrolls independently.

### Component Library

The `src/components/ui/` directory contains the full shadcn/ui component set built on top of Radix UI primitives. These are unstyled, accessible components (dialog, dropdown, tabs, select, etc.) that are styled with Tailwind. The project uses the full set including accordion, alert-dialog, avatar, badge, calendar, carousel, chart, command, context-menu, drawer, form, hover-card, input-otp, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable panels, scroll-area, sheet, sidebar, skeleton, slider, switch, table, tabs, textarea, toggle, and tooltip.

### Notifications

`Sonner` provides the toast notification system. The `<Toaster>` is mounted once in `App.jsx` with `position="top-center"` and `theme="dark"`. All success/error feedback throughout the app uses `toast.success()` and `toast.error()`.

### QR Codes

The receive tab on the coin detail page uses `react-qr-code` to render a QR code of the wallet address. The QR is hidden by default and toggled on click.

---

## Build System & Polyfills

This is one of the more complex parts of the project. Crypto libraries like `bitcoinjs-lib`, `bip32`, `ethers`, and `@solana/web3.js` were originally written for Node.js and rely on Node.js built-in modules (`Buffer`, `crypto`, `stream`, `events`, `process`, `util`, `path`, `os`). These do not exist natively in browsers.

`vite.config.js` solves this with several plugins:

- **`vite-plugin-node-polyfills`** — Injects browser-compatible polyfills for all Node.js built-ins. `fs` is polyfilled with `memfs` (an in-memory filesystem). `Buffer`, `global`, and `process` are injected as globals.
- **`vite-plugin-wasm`** — Enables WebAssembly module loading, required for `tiny-secp256k1` which uses WASM for secp256k1 elliptic curve operations.
- **`vite-plugin-top-level-await`** — Allows top-level `await` in modules, needed because WASM initialization is async.
- **`@tailwindcss/vite`** — Integrates Tailwind CSS v4 directly into the Vite pipeline.
- **`@vitejs/plugin-react`** — Standard React JSX transform and Fast Refresh.

The build output targets `esnext` to support modern browser features. Bitcoin-related libraries (`bitcoinjs-lib`, `bip32`, `ecpair`) are split into a separate `crypto-libs` chunk via `manualChunks` to optimize loading.

The `define` block sets `global: 'globalThis'` and `process.env.NODE_ENV` to ensure libraries that check these globals work correctly in the browser.

---

## Security Model

NexusVault is designed around a clear security model:

1. **Zero server trust** — No private keys, seed phrases, or passwords are ever sent to any server. All cryptographic operations happen in the browser.

2. **Encrypted at rest** — The wallet is stored in `localStorage` only in AES-256-CBC encrypted form. The encryption key is derived from the user's password using PBKDF2 with a random salt. Without the password, the stored data is unreadable.

3. **In-memory only during session** — Decrypted wallet data (including private keys) lives only in JavaScript memory. It is cleared on `logout()` and lost when the browser tab is closed.

4. **No auto-unlock** — The app never automatically decrypts the wallet. Every session requires the user to enter their password.

5. **Password-gated sensitive actions** — Revealing the recovery phrase or exporting private keys in Settings requires re-entering the password, even during an active session.

6. **Non-custodial** — The user is solely responsible for their seed phrase. If it is lost, the wallet cannot be recovered. The app explicitly warns users about this.

**Known limitations:**
- The app is vulnerable to XSS attacks like any browser-based wallet. A malicious script injected into the page could read the in-memory wallet data.
- `localStorage` is accessible to any JavaScript running on the same origin.
- The PBKDF2 iteration count (1000) is lower than modern recommendations (600,000+). This makes brute-force attacks on weak passwords faster.

---

## Running the Project

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for production

```bash
npm run build
```

Output goes to the `dist/` folder. Since this is a pure client-side app, the `dist/` folder can be served from any static file host (Netlify, Vercel, GitHub Pages, S3, etc.).

### Preview production build

```bash
npm run preview
```

---

## Environment Notes

The RPC endpoints in `src/services/blockchain.js` use GetBlock.io API keys that are hardcoded in the source. For a production deployment you should:

1. Replace the GetBlock API keys with your own from [getblock.io](https://getblock.io)
2. Move them to environment variables (`.env` file with `VITE_` prefix)
3. Consider adding an Etherscan API key for higher transaction history rate limits
