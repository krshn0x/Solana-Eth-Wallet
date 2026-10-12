import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Dialog, ErrorMessage } from "./ui";
import { unlockVault } from "../lib/vault";
import { deriveAccounts } from "../lib/wallet";
export default function UnlockDialog({
  vault,
  recovery = false,
  onComplete,
  onClose,
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await unlockVault(vault, password);
      const accounts = recovery
        ? []
        : await deriveAccounts(result.data.mnemonic, result.data.accountCount);
      onComplete({ ...result, accounts, mnemonic: result.data.mnemonic });
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={recovery ? "Verify it’s you." : "Good to see you again."}
      subtitle={
        recovery
          ? "Enter your vault password to reveal your recovery phrase."
          : "Unlock your wallet with your local password."
      }
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={submit}>
        <label className="field">
          Vault password
          <input
            autoFocus
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <ErrorMessage error={error} />
        <button className="button primary full" disabled={busy}>
          {busy
            ? "Unlocking…"
            : recovery
              ? "Reveal recovery phrase"
              : "Unlock wallet"}
          <LockKeyhole size={17} />
        </button>
      </form>
    </Dialog>
  );
}
