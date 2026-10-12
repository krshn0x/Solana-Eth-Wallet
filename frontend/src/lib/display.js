export const short = (address) => `${address.slice(0, 6)}…${address.slice(-6)}`;
export const networks = {
  testnet: { solana: "Devnet", ethereum: "Sepolia", label: "Test networks" },
  mainnet: { solana: "Mainnet", ethereum: "Mainnet", label: "Main networks" },
};
export const assets = [
  { id: "sol", name: "Solana", symbol: "SOL", chain: "solana" },
  { id: "eth", name: "Ethereum", symbol: "ETH", chain: "ethereum" },
  { id: "tokens", name: "USD Coin", symbol: "USDC", chain: "solana" },
];
export function explorer(chain, address, network) {
  return chain === "solana"
    ? `https://explorer.solana.com/address/${address}${network === "testnet" ? "?cluster=devnet" : ""}`
    : `https://${network === "testnet" ? "sepolia." : ""}etherscan.io/address/${address}`;
}
