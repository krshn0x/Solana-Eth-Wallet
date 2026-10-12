import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Dialog, ErrorMessage } from "./ui";
import { parseVault, unlockVault, VAULT_STORAGE_KEY } from "../lib/vault";
import { deriveAccounts } from "../lib/wallet";
export default function BackupDialog({ onClose, onComplete }) {
  const [fileVault, setFileVault] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function selectFile(event) {
    setFileVault(null);
    setError("");
    try {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 20000)
        throw new Error("This file is too large to be a SolVault backup.");
      setFileVault(parseVault(await file.text()));
    } catch (err) {
      setError(err.message);
    }
  }
  async function restore(event) {
    event.preventDefault();
    if (!fileVault || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await unlockVault(fileVault, password);
      const accounts = await deriveAccounts(
        result.data.mnemonic,
        result.data.accountCount,
      );
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(fileVault));
      onComplete({
        key: result.key,
        mnemonic: result.data.mnemonic,
        accounts,
        vault: fileVault,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title="Restore your encrypted backup."
      subtitle="Choose a SolVault backup and enter the password used when it was saved. The file stays on this device."
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={restore}>
        <label className="field">
          Encrypted backup
          <input
            type="file"
            accept="application/json,.json"
            onChange={selectFile}
            required
          />
        </label>
        <label className="field">
          Backup password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <ErrorMessage error={error} />
        <button className="button primary full" disabled={!fileVault || busy}>
          {busy ? "Restoring…" : "Restore backup"}
          <ArrowRight size={16} />
        </button>
      </form>
    </Dialog>
  );
}
