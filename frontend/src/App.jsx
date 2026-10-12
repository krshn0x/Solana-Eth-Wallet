import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Moon,
  Sun,
  Eye,
  Fingerprint,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
  CircleAlert,
  Download,
  KeyRound,
} from "lucide-react";
import { deriveAccount } from "./lib/wallet";
import { parseVault, updateVault, VAULT_STORAGE_KEY } from "./lib/vault";
import { short, networks } from "./lib/display";
import { Brand, Dialog, TokenIcon } from "./components/ui";
import SetupDialog from "./components/SetupDialog";
import UnlockDialog from "./components/UnlockDialog";
import ReceiveDialog from "./components/ReceiveDialog";
import BackupDialog from "./components/BackupDialog";
import BalancePanel from "./components/BalancePanel";
import AccountPanel from "./components/AccountPanel";
import RecoveryDialog from "./components/RecoveryDialog";
import { useTheme } from "./lib/useTheme";
export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(VAULT_STORAGE_KEY);
      return { vault: raw ? parseVault(raw) : null };
    } catch (err) {
      return { vault: null, error: err.message };
    }
  });
  const [vault, setVault] = useState(initial.vault);
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("overview");
  const [network, setNetwork] = useState("testnet");
  const [selected, setSelected] = useState(0);
  const [modal, setModal] = useState(null);
  const [receiveChain, setReceiveChain] = useState("solana");
  const sessionEpoch = useRef(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(initial.error || "");
  const [recovery, setRecovery] = useState("");
  const toastTimer = useRef(null);
  const adding = useRef(false);
  const accounts = session?.accounts || [];
  const account = accounts[selected];
  const closeModal = useCallback(() => {
    setModal(null);
    setRecovery("");
  }, []);
  const lock = useCallback(() => {
    sessionEpoch.current++;
    setSession(null);
    setModal(null);
    setRecovery("");
    setNotice("Wallet locked.");
  }, []);
  useEffect(() => {
    if (!session) return;
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(lock, 5 * 60 * 1000);
    };
    reset();
    window.addEventListener("pointerdown", reset);
    window.addEventListener("keydown", reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [session, lock]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => {
    function storage(event) {
      if (event.key === VAULT_STORAGE_KEY) {
        lock();
        try {
          setVault(event.newValue ? parseVault(event.newValue) : null);
        } catch (err) {
          setError(err.message);
        }
      }
    }
    window.addEventListener("storage", storage);
    return () => window.removeEventListener("storage", storage);
  }, [lock]);
  function toast(message) {
    setNotice(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setNotice(""), 3500);
  }
  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      toast("Address copied.");
    } catch {
      setError(
        "Clipboard is unavailable. Select and copy the address manually.",
      );
    }
  }
  function openWallet(result) {
    sessionEpoch.current++;
    setSession({
      mnemonic: result.mnemonic,
      accounts: result.accounts,
      key: result.key,
    });
    if (result.vault) setVault(result.vault);
    setSelected(0);
    setError("");
    closeModal();
    toast("Your wallet is ready.");
  }
  async function addAccount() {
    if (!session) {
      setModal(vault ? "unlock" : "create");
      return;
    }
    if (adding.current || accounts.length >= 100) return;
    adding.current = true;
    const epoch = sessionEpoch.current;
    setBusy(true);
    setError("");
    try {
      const nextAccount = await deriveAccount(
        session.mnemonic,
        accounts.length,
      );
      const nextVault = await updateVault(
        { mnemonic: session.mnemonic, accountCount: accounts.length + 1 },
        session.key,
        vault,
      );
      if (epoch !== sessionEpoch.current) return;
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(nextVault));
      setVault(nextVault);
      setSession({ ...session, accounts: [...accounts, nextAccount] });
      setSelected(nextAccount.index);
      toast(`Account ${nextAccount.index + 1} added.`);
    } catch (err) {
      setError(err.message);
    } finally {
      adding.current = false;
      setBusy(false);
    }
  }
  function downloadBackup() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(vault, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "solvault-encrypted-backup.json";
    link.click();
    URL.revokeObjectURL(url);
    toast("Encrypted backup downloaded.");
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {[
            { id: "overview", title: "Overview", icon: LayoutDashboard },
            { id: "accounts", title: "Accounts", icon: Wallet },
            { id: "security", title: "Security", icon: ShieldCheck },
          ].map(({ id, title, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => setPage(id)}
            >
              <Icon size={19} />
              {title}
              {id === "accounts" && (
                <span className="nav-count">{accounts.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="workspace-label account-section-title">
          ACCOUNTS
          <button
            className="icon-button"
            onClick={addAccount}
            disabled={busy}
            aria-label="Add account"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="sidebar-accounts">
          {accounts.length ? (
            accounts.map((item) => (
              <button
                key={item.index}
                className={`sidebar-account ${selected === item.index ? "selected" : ""}`}
                onClick={() => {
                  setSelected(item.index);
                  setPage("overview");
                }}
              >
                <span className="mini-avatar">{item.index + 1}</span>
                <div>
                  <strong>Account {item.index + 1}</strong>
                  <span>{short(item.solana)}</span>
                </div>
                {selected === item.index && <span className="selected-dot" />}
              </button>
            ))
          ) : (
            <p className="sidebar-empty">
              Your accounts appear here
              <br />
              when you unlock your wallet.
            </p>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="local-badge">
            <Fingerprint size={22} />
            <div>
              <strong>Yours, by design.</strong>
              <span>Keys stay on your device.</span>
            </div>
          </div>
          <button
            className="nav-item lock-button"
            onClick={
              session ? lock : () => setModal(vault ? "unlock" : "create")
            }
          >
            <LockKeyhole size={18} />
            {session
              ? "Lock wallet"
              : vault
                ? "Unlock wallet"
                : "Create a wallet"}
          </button>
          <div className="sidebar-foot">
            SOLVAULT <span>V1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace<span>/</span>
            <strong>
              {page === "overview"
                ? "Overview"
                : page === "accounts"
                  ? "Accounts"
                  : "Security"}
            </strong>
          </div>
          <div className="topbar-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <label className="network-select">
              <span
                className={`status-dot ${network === "mainnet" ? "purple" : ""}`}
              />
              <select
                aria-label="Network"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
              >
                <option value="testnet">Test networks</option>
                <option value="mainnet">Main networks</option>
              </select>
              <ChevronDown size={14} />
            </label>
            <button
              className="avatar-button"
              onClick={
                session ? lock : () => setModal(vault ? "unlock" : "create")
              }
              aria-label={session ? "Lock wallet" : "Open wallet"}
            >
              {session ? <Wallet size={18} /> : <LockKeyhole size={18} />}
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span />
                YOUR CRYPTO, YOUR CONTROL
              </div>
              <h1>
                {page === "overview"
                  ? "Everything, in one place."
                  : page === "accounts"
                    ? "Room to grow."
                    : "Peace of mind, built in."}
              </h1>
              <p>
                {page === "overview"
                  ? "A little simpler. A lot more yours. Welcome to SolVault."
                  : page === "accounts"
                    ? "Organize your on-chain world, one account at a time."
                    : "Your wallet is only as strong as your backup."}
              </p>
            </div>
            <span className="version-tag">SOL + ETH</span>
          </div>
          {error && (
            <div className="error-banner" role="alert">
              <CircleAlert size={18} />
              <span>{error}</span>
              <button
                className="icon-button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {network === "mainnet" && (
            <div className="network-banner">
              <CircleAlert size={16} />
              You’re viewing main networks. These balances represent real
              assets.
            </div>
          )}
          {page === "overview" && (
            <>
              <section className={`hero-card ${session ? "unlocked" : ""}`}>
                <div className="hero-content">
                  <span className="hero-label">
                    <span className="status-dot" />
                    {session
                      ? "WALLET UNLOCKED"
                      : vault
                        ? "YOUR WALLET IS LOCKED"
                        : "A FRESH START"}
                  </span>
                  <h2>
                    {session ? (
                      <>
                        Your wallet.
                        <br />
                        Your world.
                      </>
                    ) : vault ? (
                      <>
                        Your world,
                        <br />
                        right where you left it.
                      </>
                    ) : (
                      <>
                        Two chains.
                        <br />
                        Endless possibilities.
                      </>
                    )}
                  </h2>
                  <p>
                    {session
                      ? `Account ${selected + 1} · Solana ${networks[network].solana} & Ethereum ${networks[network].ethereum}`
                      : "One recovery phrase for Solana and Ethereum.\nMade to keep you in control."}
                  </p>
                  <div className="hero-actions">
                    {session ? (
                      <>
                        <button
                          className="button white"
                          onClick={() => {
                            setReceiveChain("solana");
                            setModal("receive");
                          }}
                        >
                          <ArrowDownLeft size={17} />
                          Receive crypto
                        </button>
                        <button
                          className="button hero-secondary"
                          onClick={() => setPage("accounts")}
                        >
                          Manage accounts
                          <ArrowRight size={17} />
                        </button>
                      </>
                    ) : vault ? (
                      <button
                        className="button white"
                        onClick={() => setModal("unlock")}
                      >
                        <LockKeyhole size={16} />
                        Unlock wallet
                      </button>
                    ) : (
                      <>
                        <button
                          className="button white"
                          onClick={() => setModal("create")}
                        >
                          <Plus size={17} />
                          Create wallet
                        </button>
                        <button
                          className="button hero-secondary"
                          onClick={() => setModal("import")}
                        >
                          Import wallet
                          <ArrowRight size={17} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="orbit-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="orbit orbit-three" />
                  <div className="art-grid" />
                  <div className="floating-coin coin-sol">
                    <TokenIcon symbol="SOL" />
                  </div>
                  <div className="floating-coin coin-eth">
                    <TokenIcon symbol="ETH" />
                  </div>
                  <span className="art-spark spark-one">✦</span>
                  <span className="art-spark spark-two">✧</span>
                  <div className="art-pill">
                    <ShieldCheck size={13} />
                    Locally encrypted
                  </div>
                </div>
              </section>
              <div className="stat-grid">
                <div className="stat-card">
                  <span className="stat-icon lavender">
                    <Wallet size={18} />
                  </span>
                  <div>
                    <span>Accounts</span>
                    <strong>
                      {session
                        ? accounts.length.toString().padStart(2, "0")
                        : "—"}
                      <small>in your wallet</small>
                    </strong>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon mint">
                    <Layers3 size={18} />
                  </span>
                  <div>
                    <span>Supported chains</span>
                    <strong>
                      02<small>Solana & Ethereum</small>
                    </strong>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon peach">
                    <ShieldCheck size={18} />
                  </span>
                  <div>
                    <span>Wallet protection</span>
                    <strong className="stat-text">
                      {session ? "Encrypted" : vault ? "Locked" : "Local-first"}
                      <small>
                        {session || vault
                          ? "Password protected"
                          : "Your keys, your device"}
                      </small>
                    </strong>
                  </div>
                </div>
              </div>
              <div className="content-grid">
                <BalancePanel
                  key={`${account?.solana || "locked"}-${network}`}
                  account={account}
                  network={network}
                  copy={copy}
                  onReceive={(chain) => {
                    setReceiveChain(chain);
                    setModal("receive");
                  }}
                />
                <div className="right-column">
                  <section className="panel security-card">
                    <div className="card-symbol">
                      <ShieldCheck size={23} />
                    </div>
                    <span className="eyebrow">A LITTLE PEACE OF MIND</span>
                    <h2>
                      Self-custody.
                      <br /> Without the guesswork.
                    </h2>
                    <p>
                      Your recovery phrase and keys are handled on your device.
                      Your password protects your saved wallet.
                    </p>
                    <button
                      className="text-link"
                      onClick={() => setPage("security")}
                    >
                      Explore wallet security
                      <ArrowRight size={16} />
                    </button>
                    <div className="security-card-footer">
                      <span className="status-dot" />
                      Private by default
                    </div>
                  </section>
                  <section className="network-card">
                    <span className="stat-icon lavender">
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <strong>
                        {network === "testnet"
                          ? "A space to experiment."
                          : "Your on-chain view."}
                      </strong>
                      <p>
                        {network === "testnet"
                          ? "Devnet + Sepolia. Test tokens, real learning."
                          : "Mainnet balances. Network labels always visible."}
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}
          {page === "accounts" && (
            <AccountPanel
              {...{
                accounts,
                selected,
                setSelected,
                addAccount,
                busy,
                network,
                copy,
              }}
            />
          )}
          {page === "security" && (
            <div className="security-layout">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Your safety essentials</h2>
                    <p>A few good habits go a long way.</p>
                  </div>
                  <ShieldCheck size={23} />
                </div>
                <div className="security-row">
                  <span className="stat-icon lavender">
                    <KeyRound size={20} />
                  </span>
                  <div>
                    <h3>Recovery phrase</h3>
                    <p>Your backup restores every account. Never share it.</p>
                  </div>
                  <button
                    className="button subtle compact"
                    disabled={!session}
                    onClick={() => setModal("verify-recovery")}
                  >
                    <Eye size={15} />
                    View phrase
                  </button>
                </div>
                <div className="security-row">
                  <span className="stat-icon mint">
                    <Download size={20} />
                  </span>
                  <div>
                    <h3>Encrypted backup</h3>
                    <p>A downloadable copy of your password-protected vault.</p>
                  </div>
                  <button
                    className="button subtle compact"
                    disabled={!vault}
                    onClick={downloadBackup}
                  >
                    Download
                  </button>
                </div>
                <div className="security-row">
                  <span className="stat-icon lavender">
                    <Download size={20} />
                  </span>
                  <div>
                    <h3>Restore encrypted backup</h3>
                    <p>Open a saved backup file using its original password.</p>
                  </div>
                  <button
                    className="button subtle compact"
                    onClick={() =>
                      setModal(vault ? "backup-replace" : "backup-import")
                    }
                  >
                    Choose file
                  </button>
                </div>
                <div className="security-row">
                  <span className="stat-icon peach">
                    <LockKeyhole size={20} />
                  </span>
                  <div>
                    <h3>Automatic locking</h3>
                    <p>Your wallet locks after 5 minutes of inactivity.</p>
                  </div>
                  <span className="enabled-tag">Enabled</span>
                </div>
                <div className="security-row">
                  <span className="stat-icon lavender">
                    <RefreshCw size={20} />
                  </span>
                  <div>
                    <h3>Restore a wallet</h3>
                    <p>
                      Replace this browser’s vault using your recovery phrase.
                    </p>
                  </div>
                  <button
                    className="button subtle compact"
                    onClick={() => setModal(vault ? "replace" : "import")}
                  >
                    Restore
                  </button>
                </div>
                <div className="security-row">
                  <span className="stat-icon peach">
                    <X size={20} />
                  </span>
                  <div>
                    <h3>Remove local wallet</h3>
                    <p>Clear this browser’s saved vault after backing it up.</p>
                  </div>
                  <button
                    className="button subtle compact"
                    disabled={!vault}
                    onClick={() => setModal("remove")}
                  >
                    Remove
                  </button>
                </div>
              </section>
              <aside className="panel security-notes">
                <Fingerprint size={32} />
                <h2>What stays private?</h2>
                <p>
                  Your recovery phrase is generated and used locally. Only
                  public addresses go to the balance service.
                </p>
                <p>
                  The saved vault is encrypted with your password. Keep your
                  phrase backed up separately: clearing browser data removes the
                  saved vault.
                </p>
                <p className="small-note">
                  Learning project · Not independently audited. This version
                  supports account creation, recovery, and balance viewing;
                  transaction signing is not included.
                </p>
              </aside>
            </div>
          )}
          <footer className="main-footer">
            <span>
              <span className="status-dot" />
              Built for your on-chain everyday.
            </span>
            <span>
              Solana + Ethereum<span className="footer-dot">·</span>SolVault v1
            </span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      {(modal === "create" || modal === "import") && (
        <SetupDialog
          key={modal}
          mode={modal}
          onClose={closeModal}
          onComplete={openWallet}
        />
      )}
      {modal === "unlock" && vault && (
        <UnlockDialog
          vault={vault}
          onComplete={openWallet}
          onClose={closeModal}
        />
      )}
      {modal === "verify-recovery" && vault && (
        <UnlockDialog
          recovery
          vault={vault}
          onClose={closeModal}
          onComplete={(result) => {
            setRecovery(result.mnemonic);
            setModal("recovery");
          }}
        />
      )}
      {modal === "recovery" && recovery && (
        <RecoveryDialog mnemonic={recovery} onClose={closeModal} />
      )}
      {modal === "receive" && account && (
        <ReceiveDialog
          initialChain={receiveChain}
          {...{ account, network, copy }}
          onClose={closeModal}
        />
      )}
      {modal === "remove" && (
        <Dialog
          title="Remove this local wallet?"
          subtitle="This removes the encrypted vault saved in this browser. Make sure you have your recovery phrase or encrypted backup before continuing."
          onClose={closeModal}
        >
          <button
            className="button primary full"
            onClick={() => {
              try {
                localStorage.removeItem(VAULT_STORAGE_KEY);
                lock();
                setVault(null);
                setSelected(0);
                setPage("overview");
                toast("Local wallet removed.");
              } catch {
                setError("Could not remove local storage.");
                closeModal();
              }
            }}
          >
            I have my backup · Remove wallet
          </button>
          <button className="text-button full" onClick={closeModal}>
            Keep my wallet
          </button>
        </Dialog>
      )}
      {modal === "backup-import" && (
        <BackupDialog onClose={closeModal} onComplete={openWallet} />
      )}
      {(modal === "replace" || modal === "backup-replace") && (
        <Dialog
          title="Restore a different wallet?"
          subtitle="This replaces the encrypted wallet saved in this browser. Save your existing recovery phrase or encrypted backup first."
          onClose={closeModal}
        >
          <button
            className="button primary full"
            onClick={() =>
              setModal(modal === "backup-replace" ? "backup-import" : "import")
            }
          >
            I have my backup · Continue
            <ArrowRight size={16} />
          </button>
          <button className="text-button full" onClick={closeModal}>
            Keep current wallet
          </button>
        </Dialog>
      )}
    </div>
  );
}
