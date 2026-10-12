import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Dialog, ErrorMessage, PasswordFields } from "./ui";
import {
  createMnemonic,
  deriveAccount,
  isValidMnemonic,
  normalizeMnemonic,
} from "../lib/wallet";
import { createVault, VAULT_STORAGE_KEY } from "../lib/vault";
export default function SetupDialog({ mode, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [phrase, setPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [answers, setAnswers] = useState(["", "", ""]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const importing = mode === "import";
  const words = phrase.split(" ");
  const checks = [2, 6, 10];
  async function finish(event) {
    event.preventDefault();
    setError("");
    if (busy) return;
    if (password.length < 12 || password !== confirm) {
      setError(
        "Use at least 12 characters and make sure both passwords match.",
      );
      return;
    }
    if (importing && !isValidMnemonic(phrase)) {
      setError(
        "Enter a valid 12, 15, 18, 21, or 24-word English recovery phrase.",
      );
      return;
    }
    if (!importing && step === 0) {
      setPhrase(createMnemonic());
      setStep(1);
      return;
    }
    if (!importing && step === 1) {
      setStep(2);
      return;
    }
    if (
      !importing &&
      !checks.every(
        (index, i) => answers[i].trim().toLowerCase() === words[index],
      )
    ) {
      setError("Those words do not match. Go back and check your backup.");
      return;
    }
    setBusy(true);
    try {
      const mnemonic = normalizeMnemonic(phrase);
      const account = await deriveAccount(mnemonic, 0);
      const result = await createVault({ mnemonic, accountCount: 1 }, password);
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(result.vault));
      onComplete({ mnemonic, accounts: [account], ...result });
      setPassword("");
      setConfirm("");
      setPhrase("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={
        importing
          ? "Welcome back."
          : step === 0
            ? "Make yourself at home."
            : step === 1
              ? "Your wallet starts here."
              : "Check your backup."
      }
      subtitle={
        importing
          ? "Restore your accounts with your recovery phrase."
          : step === 0
            ? "Create a wallet that belongs to you."
            : step === 1
              ? "Write these words down, in order. Keep them somewhere private."
              : "Enter three words to confirm you saved your phrase."
      }
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="steps">
        <span className="active">{importing ? "Restore" : "01 · Protect"}</span>
        {!importing && (
          <>
            <span className={step >= 1 ? "active" : ""}>02 · Back up</span>
            <span className={step >= 2 ? "active" : ""}>03 · Verify</span>
          </>
        )}
      </div>
      <form onSubmit={finish}>
        {importing && (
          <label className="field">
            Recovery phrase
            <textarea
              autoFocus
              rows={3}
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Enter your recovery words, separated by spaces"
              required
            />
            <span className="field-help">
              Uses the original SolVault account paths. BIP-39 passphrases are
              not supported in this version.
            </span>
          </label>
        )}
        {(step === 0 || importing) && (
          <PasswordFields {...{ password, setPassword, confirm, setConfirm }} />
        )}
        {!importing && step === 1 && (
          <div className="word-grid">
            {words.map((word, i) => (
              <div key={i}>
                <span>{i + 1}</span>
                {word}
              </div>
            ))}
          </div>
        )}
        {!importing && step === 2 && (
          <div className="verify-grid">
            {checks.map((index, i) => (
              <label key={index} className="field">
                Word {index + 1}
                <input
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={answers[i]}
                  onChange={(e) =>
                    setAnswers(
                      answers.map((answer, j) =>
                        j === i ? e.target.value : answer,
                      ),
                    )
                  }
                  required
                />
              </label>
            ))}
          </div>
        )}
        {(step === 1 || importing) && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              required
            />
            <span>
              {importing
                ? "I have a safe backup of this recovery phrase."
                : "I saved my phrase. I understand it is the only way to recover my wallet."}
            </span>
          </label>
        )}
        <ErrorMessage error={error} />
        <button
          className="button primary full"
          disabled={busy || (step === 1 && !acknowledged)}
        >
          {busy
            ? "Opening your wallet…"
            : importing
              ? "Import wallet"
              : step === 0
                ? "Create recovery phrase"
                : step === 1
                  ? "I saved my phrase"
                  : "Open my wallet"}
          <ArrowRight size={17} />
        </button>
        {!importing && step > 0 && (
          <button
            type="button"
            className="text-button full"
            disabled={busy}
            onClick={() => {
              setError("");
              setStep(step - 1);
            }}
          >
            Back
          </button>
        )}
      </form>
      <p className="private-note">
        <ShieldCheck size={14} />
        Your phrase stays on this device.
      </p>
    </Dialog>
  );
}
