const express = require("express");
const cors = require("cors");
const path = require("node:path");
const { PublicKey } = require("@solana/web3.js");
const { isAddress, formatUnits } = require("ethers");

const NETWORKS = {
  testnet: {
    solana:
      process.env.SOLANA_DEVNET_RPC_URL || "https://api.devnet.solana.com",
    ethereum:
      process.env.ETHEREUM_SEPOLIA_RPC_URL ||
      "https://ethereum-sepolia-rpc.publicnode.com",
    usdc: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  },
  mainnet: {
    solana:
      process.env.SOLANA_MAINNET_RPC_URL ||
      "https://api.mainnet-beta.solana.com",
    ethereum:
      process.env.ETHEREUM_MAINNET_RPC_URL ||
      "https://ethereum-rpc.publicnode.com",
    usdc: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
};
async function rpc(url, method, params, fetchImpl) {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("RPC request failed");
  const data = await response.json();
  if (data.error || data.result === undefined)
    throw new Error("RPC returned an error");
  return data.result;
}
function createApp({ fetchImpl = fetch, serveFrontend = false } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    cors({
      origin: (
        process.env.FRONTEND_ORIGIN ||
        "http://127.0.0.1:5173,http://localhost:5173"
      ).split(","),
    }),
  );
  app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Referrer-Policy", "no-referrer");
    res.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    );
    next();
  });
  const visitors = new Map();
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    const now = Date.now();
    const address = req.ip;
    if (visitors.size > 5000)
      for (const [key, item] of visitors)
        if (now - item.start >= 60000) visitors.delete(key);
    const entry = visitors.get(address);
    const current =
      !entry || now - entry.start >= 60000 ? { start: now, count: 0 } : entry;
    current.count++;
    visitors.set(address, current);
    if (current.count > 120)
      return res
        .status(429)
        .json({ error: "Too many balance requests. Wait a minute and retry." });
    next();
  });
  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", networks: ["testnet", "mainnet"] }),
  );
  // Wallet secrets no longer have a server-side endpoint.
  app.use("/api/wallet", (_req, res) =>
    res
      .status(410)
      .json({
        error:
          "Wallet creation and recovery now happen locally in the browser.",
      }),
  );
  app.get("/api/balance/:chain/:address", async (req, res) => {
    const { chain, address } = req.params;
    const network = req.query.network || "testnet";
    if (
      !["testnet", "mainnet"].includes(network) ||
      !["sol", "eth", "tokens"].includes(chain)
    )
      return res.status(400).json({ error: "Invalid network or asset." });
    try {
      if (chain === "eth") {
        if (!/^0x[0-9a-fA-F]{40}$/.test(address) || !isAddress(address))
          throw new Error();
      } else new PublicKey(address);
    } catch {
      return res.status(400).json({ error: "Invalid wallet address." });
    }
    const config = NETWORKS[network];
    try {
      let balance;
      let symbol;
      if (chain === "sol") {
        const result = await rpc(
          config.solana,
          "getBalance",
          [address, { commitment: "confirmed" }],
          fetchImpl,
        );
        if (!Number.isSafeInteger(result.value) || result.value < 0)
          throw new Error();
        balance = formatUnits(BigInt(result.value), 9);
        symbol = "SOL";
      } else if (chain === "eth") {
        const result = await rpc(
          config.ethereum,
          "eth_getBalance",
          [address, "latest"],
          fetchImpl,
        );
        if (typeof result !== "string" || !/^0x[0-9a-fA-F]+$/.test(result))
          throw new Error();
        balance = formatUnits(BigInt(result), 18);
        symbol = "ETH";
      } else {
        const result = await rpc(
          config.solana,
          "getTokenAccountsByOwner",
          [
            address,
            { mint: config.usdc },
            { encoding: "jsonParsed", commitment: "confirmed" },
          ],
          fetchImpl,
        );
        if (!Array.isArray(result.value)) throw new Error();
        let amount = 0n;
        for (const account of result.value) {
          const token = account.account.data.parsed.info.tokenAmount;
          if (token.decimals !== 6 || !/^\d+$/.test(token.amount))
            throw new Error();
          amount += BigInt(token.amount);
        }
        balance = formatUnits(amount, 6);
        symbol = "USDC";
      }
      res.json({ address, network, symbol, balance });
    } catch {
      res
        .status(502)
        .json({
          error: "The network could not return this balance. Please retry.",
        });
    }
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API endpoint not found." }),
  );
  if (serveFrontend) {
    const directory = path.resolve(__dirname, "../frontend/dist");
    app.use(express.static(directory));
    app.get("/{*path}", (_req, res) =>
      res.sendFile(path.join(directory, "index.html")),
    );
  }
  return app;
}
module.exports = { createApp, NETWORKS };
