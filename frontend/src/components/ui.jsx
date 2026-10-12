import { useEffect, useRef } from "react";
import { Layers3, Wallet, X, CircleAlert } from "lucide-react";
export function TokenIcon({ symbol, small = false }) {
  return (
    <span
      className={`token-icon ${symbol.toLowerCase()} ${small ? "small" : ""}`}
      aria-hidden="true"
    >
      {symbol === "SOL" ? (
        <i>
          <b />
          <b />
          <b />
        </i>
      ) : symbol === "ETH" ? (
        <svg viewBox="0 0 24 32">
          <path
            d="M12 1 1 17l11 6 11-6L12 1Z"
            fill="currentColor"
            opacity=".9"
          />
          <path
            d="m1 19 11 12 11-12-11 6-11-6Z"
            fill="currentColor"
            opacity=".65"
          />
          <path d="M12 1v22l11-6L12 1Z" fill="white" opacity=".3" />
        </svg>
      ) : (
        "$"
      )}
    </span>
  );
}

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon">
        <Layers3 size={22} strokeWidth={2.4} />
      </span>
      <span>
        solvault<span className="brand-dot">.</span>
      </span>
    </div>
  );
}

export function Dialog({ title, subtitle, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    dialog
      .querySelector("[autofocus], input:not([type=checkbox]), textarea")
      ?.focus();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="dialog-title"
      className="dialog"
    >
      <button
        className="icon-button dialog-close"
        onClick={onClose}
        aria-label="Close dialog"
      >
        <X size={20} />
      </button>
      <div className="dialog-symbol">
        <Wallet size={24} />
      </div>
      <h2 id="dialog-title">{title}</h2>
      {subtitle && <p className="muted dialog-subtitle">{subtitle}</p>}
      {children}
    </dialog>
  );
}

export function ErrorMessage({ error }) {
  return error ? (
    <p className="form-error" role="alert">
      <CircleAlert size={16} />
      {error}
    </p>
  ) : null;
}

export function PasswordFields({ password, setPassword, confirm, setConfirm }) {
  return (
    <>
      <label className="field">
        Vault password
        <input
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 12 characters"
        />
      </label>
      <label className="field">
        Confirm password
        <input
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Enter your password again"
        />
      </label>
      <p className="field-help">
        This password unlocks your wallet on this browser. Your recovery phrase
        restores it on another device.
      </p>
    </>
  );
}
