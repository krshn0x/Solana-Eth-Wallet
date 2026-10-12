const ITERATIONS = 600000;
export const VAULT_STORAGE_KEY = "solvault.v1";
const encode = (bytes) => btoa(String.fromCharCode(...bytes));
const decode = (text) =>
  Uint8Array.from(atob(text), (character) => character.charCodeAt(0));
async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export function parseVault(value) {
  try {
    const vault = JSON.parse(value);
    if (
      vault.version !== 1 ||
      vault.iterations !== ITERATIONS ||
      decode(vault.salt).length !== 16 ||
      decode(vault.iv).length !== 12 ||
      typeof vault.ciphertext !== "string" ||
      vault.ciphertext.length > 20000
    )
      throw new Error();
    return vault;
  } catch {
    throw new Error(
      "This vault is damaged or uses an unsupported format. Restore using your recovery phrase.",
    );
  }
}
export async function encryptVault(data, key, salt) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode("solvault.v1"),
    },
    key,
    new TextEncoder().encode(JSON.stringify(data)),
  );
  return {
    version: 1,
    iterations: ITERATIONS,
    salt: encode(salt),
    iv: encode(iv),
    ciphertext: encode(new Uint8Array(ciphertext)),
  };
}
export async function createVault(data, password) {
  if (typeof password !== "string" || password.length < 12)
    throw new Error("Use a password with at least 12 characters.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  return { key, vault: await encryptVault(data, key, salt) };
}
export async function updateVault(data, key, vault) {
  return encryptVault(data, key, decode(vault.salt));
}
export async function unlockVault(vault, password) {
  parseVault(JSON.stringify(vault));
  const key = await deriveKey(password, decode(vault.salt));
  let plaintext;
  try {
    plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decode(vault.iv),
        additionalData: new TextEncoder().encode("solvault.v1"),
      },
      key,
      decode(vault.ciphertext),
    );
  } catch {
    throw new Error(
      "Could not unlock. Check your password; the vault may also be damaged.",
    );
  }
  const data = JSON.parse(new TextDecoder().decode(plaintext));
  if (
    typeof data.mnemonic !== "string" ||
    !Number.isInteger(data.accountCount) ||
    data.accountCount < 1 ||
    data.accountCount > 100
  )
    throw new Error("Invalid vault data.");
  return { key, data };
}
