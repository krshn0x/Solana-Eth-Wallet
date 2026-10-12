import {
  generateMnemonic,
  validateMnemonic,
  mnemonicToSeed,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha512";
import { ed25519 } from "@noble/curves/ed25519";
import { HDNodeWallet, Mnemonic } from "ethers";
import bs58 from "bs58";
export function normalizeMnemonic(value) {
  return value.normalize("NFKD").trim().toLowerCase().replace(/\s+/g, " ");
}
export function isValidMnemonic(value) {
  return (
    typeof value === "string" &&
    validateMnemonic(normalizeMnemonic(value), wordlist)
  );
}
export function createMnemonic() {
  return generateMnemonic(wordlist, 128);
}
// SLIP-0010 hardened ed25519 derivation. No secrets leave the browser.
function deriveSolanaSeed(seed, index) {
  let node = hmac(sha512, new TextEncoder().encode("ed25519 seed"), seed);
  for (const component of [44, 501, index, 0]) {
    const data = new Uint8Array(37);
    data.set(node.slice(0, 32), 1);
    new DataView(data.buffer).setUint32(33, component + 0x80000000, false);
    const next = hmac(sha512, node.slice(32), data);
    node.fill(0);
    data.fill(0);
    node = next;
  }
  const key = node.slice(0, 32);
  node.fill(0);
  return key;
}
export async function deriveAccount(value, index) {
  const phrase = normalizeMnemonic(value);
  if (!isValidMnemonic(phrase))
    throw new Error("Enter a valid recovery phrase with a correct checksum.");
  if (!Number.isInteger(index) || index < 0 || index >= 100)
    throw new Error("Account index must be between 0 and 99.");
  const seed = await mnemonicToSeed(phrase);
  const solanaKey = deriveSolanaSeed(seed, index);
  try {
    return {
      index,
      solana: bs58.encode(ed25519.getPublicKey(solanaKey)),
      ethereum: HDNodeWallet.fromMnemonic(
        Mnemonic.fromPhrase(phrase),
        `m/44'/60'/${index}'/0/0`,
      ).address,
    };
  } finally {
    seed.fill(0);
    solanaKey.fill(0);
  }
}
export async function deriveAccounts(mnemonic, count) {
  if (!Number.isInteger(count) || count < 1 || count > 100)
    throw new Error("Invalid account count.");
  return Promise.all(
    Array.from({ length: count }, (_, index) => deriveAccount(mnemonic, index)),
  );
}
