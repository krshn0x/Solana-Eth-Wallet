# SolVault · Solana + Ethereum Wallet

A working React wallet frontend with local account creation, recovery, encrypted persistence, and public on-chain balances. Built from the original Solana-Eth-Wallet learning project.

## Run locally

Use Node.js 22.12 or newer.

```bash
npm run setup
npm run dev
```

Open **http://127.0.0.1:5173**. The frontend runs on port 5173 and the balance API on port 3001. Stop both with Ctrl+C. If these ports are already occupied, stop the previous instance first.

For a production build served by Express:

```bash
npm run build
npm start
```

Open **http://127.0.0.1:3001**. Deploy behind HTTPS; Web Crypto requires a secure context (localhost works for development). Set `HOST=0.0.0.0` only when your deployment requires external binding.

## Working features

- Create a cryptographically random 12-word English BIP-39 recovery phrase.
- Verify three recovery words before saving a new wallet.
- Import valid 12/15/18/21/24-word English phrases.
- Derive up to 100 deterministic accounts, each with Solana and Ethereum addresses.
- Save an AES-256-GCM encrypted vault locally; unlock using a password of at least 12 characters.
- Automatic lock after five minutes without clicks or keystrokes; reload starts locked.
- Download and restore encrypted JSON backups with the original password.
- Remove the local vault after confirming you have a backup.
- Reveal recovery words only after password verification, with a one-minute timeout.
- Receive QR codes, copy addresses, and open network-correct explorers.
- Read native SOL and ETH balances and Solana USDC balances.
- Switch between Solana devnet + Ethereum Sepolia and both mainnets.
- Explicit loading/error/retry states; RPC failures never become a fabricated zero.
- Responsive dashboard, account management, and security views.

## Architecture

```text
React browser
  ├── BIP-39 / SLIP-0010 / Ethereum HD derivation (local)
  ├── AES-GCM encrypted vault in localStorage (local)
  └── public addresses → Express balance API → blockchain RPCs
```

The backend does not create wallets, receive recovery phrases, derive keys, sign, or send transactions. Previous `/api/wallet/*` endpoints return 410 Gone. No database or authentication account is required.

The browser uses `@scure/bip39`, `@noble/hashes`, `@noble/curves`, and `ethers` for recovery and account derivation. Solana uses hardened SLIP-0010 ed25519 derivation. Web Crypto encrypts the vault using a random 16-byte salt, PBKDF2-HMAC-SHA256 (600,000 iterations), and a fresh 12-byte AES-GCM IV for every save. The mnemonic and account count are both encrypted. An unlocked session holds the mnemonic and encryption key in memory; locking removes application references. JavaScript cannot guarantee memory zeroization.

### Account compatibility

Paths intentionally preserve the original project's account convention:

- Solana: `m/44'/501'/{account}'/0'`
- Ethereum: `m/44'/60'/{account}'/0/0`

Ethereum's first account matches common wallets. Later accounts follow the account-based convention and may differ from wallets that increment the final address component, such as MetaMask. BIP-39 passphrases and custom derivation paths are not supported; phrases using them will not restore the same addresses.

### Network configuration

Copy `backend/.env.example` to `backend/.env` to supply dedicated RPC endpoints. Node reads that file at startup. Public endpoints can rate-limit requests; the frontend shows unavailable balances with retry controls.

| Selection               | Solana       | Ethereum | Solana USDC mint                               |
| ----------------------- | ------------ | -------- | ---------------------------------------------- |
| Test networks (default) | Devnet       | Sepolia  | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |
| Main networks           | Mainnet beta | Mainnet  | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |

USDC addresses follow [Circle's documentation](https://developers.circle.com/stablecoins/usdc-contract-addresses). The service sums all token accounts for the selected mint, not just the associated token account. API amounts are decimal strings to preserve precision; the UI rounds displayed balances to eight native-token or six USDC decimal places.

### API

```text
GET /api/health
GET /api/balance/sol/:address?network=testnet|mainnet
GET /api/balance/eth/:address?network=testnet|mainnet
GET /api/balance/tokens/:address?network=testnet|mainnet
```

Example response:

```json
{
  "address": "...",
  "network": "testnet",
  "symbol": "SOL",
  "balance": "1.23456789"
}
```

Invalid requests return 400. RPC failures return 502 with a public error message. Rate limiting returns 429 after 120 requests per minute per IP. The service has a 12-second RPC timeout, no secret logging, no-store API responses, and a production Content Security Policy.

## Verification

```bash
npm run lint
npm test
npm run build
```

Tests cover known derivation addresses, recovery normalization, invalid phrases/indexes, encrypted roundtrips, wrong passwords, tampered vaults, exact RPC amounts, token aggregation, network selection, and upstream failures. GitHub Actions runs installation, lint, tests, and build on pushes and pull requests. Tests use synthetic recovery phrases and mocked RPC responses, never user wallets.

## Scope and limitations

This is a learning project and has not been independently audited. Use test networks while evaluating it. Transaction signing/sending, transaction history, price feeds, Ethereum ERC-20 discovery, hardware wallets, and wallet-extension connections are not included in this version.

An encrypted local vault does not protect an already unlocked session from malicious scripts or browser extensions. Keep dependencies reviewed and serve over HTTPS. Clearing site data deletes the vault; recovery requires the phrase or an encrypted backup and its password. A forgotten password cannot be reset without a backup. The app never asks you to copy a recovery phrase to the clipboard.

## Sources

- [Ethers HD wallet API](https://docs.ethers.org/v6/api/wallet/)
- [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [SLIP-0010](https://github.com/satoshilabs/slips/blob/master/slip-0010.md)
- [Solana clusters](https://solana.com/docs/references/clusters)
