import test from "node:test";
import assert from "node:assert/strict";
import {
  createMnemonic,
  deriveAccount,
  isValidMnemonic,
} from "../src/lib/wallet.js";
const phrase = "abandon ".repeat(11) + "about";
test("BIP-39 known phrase derives compatible Solana and Ethereum addresses", async () => {
  const account = await deriveAccount(phrase, 0);
  assert.equal(account.solana, "HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk");
  assert.equal(account.ethereum, "0x9858EfFD232B4033E47d90003D41EC34EcaEda94");
});
test("distinct accounts derive deterministically", async () => {
  const first = await deriveAccount(phrase, 0);
  const next = await deriveAccount(phrase, 1);
  assert.equal(next.solana, "Hh8QwFUA6MtVu1qAoq12ucvFHNwCcVTV7hpWjeY1Hztb");
  assert.equal(next.ethereum, "0x78839F6054d7ed13918bAe0473BA31b1Ca9D7265");
  assert.notEqual(first.solana, next.solana);
  assert.notEqual(first.ethereum, next.ethereum);
  assert.deepEqual(next, await deriveAccount(phrase, 1));
});
test("import normalizes whitespace and uppercase", async () => {
  assert.deepEqual(
    await deriveAccount(`  ${phrase.toUpperCase().replaceAll(" ", "\n")}  `, 0),
    await deriveAccount(phrase, 0),
  );
});
test("rejects invalid checksum and invalid indexes", async () => {
  assert.equal(isValidMnemonic("abandon ".repeat(12)), false);
  await assert.rejects(deriveAccount("not a seed", 0));
  for (const index of [-1, 0.5, "0", 100])
    await assert.rejects(deriveAccount(phrase, index));
});
test("generation uses valid unique 12-word recovery phrases", () => {
  const phrases = Array.from({ length: 20 }, createMnemonic);
  for (const value of phrases) {
    assert.equal(value.split(" ").length, 12);
    assert.ok(isValidMnemonic(value));
  }
  assert.equal(new Set(phrases).size, phrases.length);
});
