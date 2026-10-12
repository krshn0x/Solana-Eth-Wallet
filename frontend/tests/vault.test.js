import test from "node:test";
import assert from "node:assert/strict";
import {
  createVault,
  parseVault,
  unlockVault,
  updateVault,
} from "../src/lib/vault.js";
const password = "a test-only password";
const data = { mnemonic: "abandon ".repeat(11) + "about", accountCount: 2 };
test("encrypted persistence roundtrip, fresh IVs, and account updates", async () => {
  const { vault, key } = await createVault(data, password);
  assert.equal(JSON.stringify(vault).includes("abandon"), false);
  assert.equal(
    (await unlockVault(parseVault(JSON.stringify(vault)), password)).data
      .mnemonic,
    data.mnemonic,
  );
  const next = await updateVault({ ...data, accountCount: 3 }, key, vault);
  assert.notEqual(vault.iv, next.iv);
  assert.equal((await unlockVault(next, password)).data.accountCount, 3);
});
test("rejects wrong passwords and tampered ciphertext", async () => {
  const { vault } = await createVault(data, password);
  await assert.rejects(unlockVault(vault, "a wrong password"));
  const changed = {
    ...vault,
    ciphertext:
      (vault.ciphertext[0] === "A" ? "B" : "A") + vault.ciphertext.slice(1),
  };
  await assert.rejects(unlockVault(changed, password));
});
test("rejects short passwords, invalid formats, and excessive KDF values", async () => {
  await assert.rejects(createVault(data, "short"));
  assert.throws(() => parseVault("{}"));
  const { vault } = await createVault(data, password);
  assert.throws(() =>
    parseVault(JSON.stringify({ ...vault, iterations: 999999999 })),
  );
});
