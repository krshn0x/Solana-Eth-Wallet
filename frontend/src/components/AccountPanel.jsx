import { Plus, Check, Wallet, Copy, ExternalLink } from "lucide-react";
import { TokenIcon } from "./ui";
import { explorer } from "../lib/display";
export default function AccountPanel({
  accounts,
  selected,
  setSelected,
  addAccount,
  busy,
  network,
  copy,
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Your accounts</h2>
          <p>Each account has a Solana and an Ethereum address.</p>
        </div>
        <button
          className="button primary compact"
          onClick={addAccount}
          disabled={busy || accounts.length >= 100}
        >
          <Plus size={16} />
          {busy ? "Adding…" : "Add account"}
        </button>
      </div>
      {accounts.length === 0 ? (
        <div className="empty-state">
          <Wallet size={32} />
          <h3>Your accounts will live here.</h3>
          <p>Create or unlock your wallet to get started.</p>
        </div>
      ) : (
        <div className="account-list">
          {accounts.map((account) => (
            <div
              className={`account-card ${selected === account.index ? "is-selected" : ""}`}
              key={account.index}
            >
              <div className="account-card-top">
                <span className="account-avatar">
                  {String(account.index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>Account {account.index + 1}</h3>
                  <p>
                    {selected === account.index
                      ? "Selected account"
                      : "Two-chain account"}
                  </p>
                </div>
                <button
                  className="button subtle compact"
                  onClick={() => setSelected(account.index)}
                  disabled={selected === account.index}
                >
                  {selected === account.index ? <Check size={16} /> : "Select"}
                </button>
              </div>
              {["solana", "ethereum"].map((chain) => (
                <div className="account-address" key={chain}>
                  <TokenIcon
                    symbol={chain === "solana" ? "SOL" : "ETH"}
                    small
                  />
                  <span>{account[chain]}</span>
                  <button
                    className="icon-button"
                    onClick={() => copy(account[chain])}
                    aria-label={`Copy ${chain} address for account ${account.index + 1}`}
                  >
                    <Copy size={15} />
                  </button>
                  <a
                    className="icon-button"
                    href={explorer(chain, account[chain], network)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View ${chain} account in explorer`}
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
