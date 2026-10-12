import { useEffect, useState } from "react";
import { RefreshCw, ArrowDownLeft, LockKeyhole, Copy } from "lucide-react";
import { TokenIcon } from "./ui";
import { assets, short, networks } from "../lib/display";
import { getBalance } from "../api/api";
export default function BalancePanel({ account, network, onReceive, copy }) {
  const [balances, setBalances] = useState({});
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!account) return;
    const controller = new AbortController();
    for (const asset of assets)
      getBalance(asset.id, account[asset.chain], network, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted)
            setBalances((previous) => ({
              ...previous,
              [asset.id]: { value: data.balance },
            }));
        })
        .catch((err) => {
          if (!controller.signal.aborted)
            setBalances((previous) => ({
              ...previous,
              [asset.id]: { error: err.message },
            }));
        });
    return () => controller.abort();
  }, [account, network, refresh]);
  const fetching = account && assets.some((asset) => !balances[asset.id]);
  function reload() {
    setBalances({});
    setRefresh((value) => value + 1);
  }
  return (
    <section className="panel assets-panel">
      <div className="panel-heading">
        <div>
          <h2>Your assets</h2>
          <p>Three assets. Two ecosystems. One wallet.</p>
        </div>
        <button
          className="button subtle compact"
          onClick={reload}
          disabled={!account || fetching}
        >
          <RefreshCw size={15} className={fetching ? "spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="asset-table">
        <div className="asset-table-head">
          <span>Asset / network</span>
          <span>Balance</span>
          <span />
        </div>
        {assets.map((asset) => {
          const balance = balances[asset.id];
          return (
            <div className="asset-row" key={asset.id}>
              <div className="asset-info">
                <TokenIcon symbol={asset.symbol} />
                <div>
                  <strong>{asset.name}</strong>
                  <span>
                    {asset.symbol}
                    <i>·</i>
                    {networks[network][asset.chain]}
                  </span>
                </div>
              </div>
              <div className="asset-balance">
                <strong>
                  {!account
                    ? "—"
                    : !balance
                      ? "Loading…"
                      : balance.error
                        ? "Unavailable"
                        : Number(balance.value).toLocaleString("en-US", {
                            maximumFractionDigits:
                              asset.id === "tokens" ? 6 : 8,
                          })}
                </strong>
                <span>
                  {balance?.error ? (
                    <button
                      className="text-button"
                      onClick={reload}
                      title={balance.error}
                    >
                      Retry balance
                    </button>
                  ) : (
                    asset.symbol
                  )}
                </span>
              </div>
              <button
                className="icon-button"
                disabled={!account}
                onClick={() => onReceive(asset.chain)}
                aria-label={`Receive ${asset.symbol}`}
              >
                <ArrowDownLeft size={18} />
              </button>
            </div>
          );
        })}
      </div>
      {account ? (
        <div className="asset-footer">
          <span className="status-dot" />
          Public balances fetched from blockchain RPCs
          {Object.values(balances).some((item) => item.error) && (
            <span className="balance-warning">
              Some balances could not be loaded.
            </span>
          )}
        </div>
      ) : (
        <div className="asset-footer">
          <LockKeyhole size={14} />
          Create or unlock a wallet to see your balances.
        </div>
      )}
      <div className="address-strip">
        <div>
          <TokenIcon symbol="SOL" small />
          <span>{account ? short(account.solana) : "Solana address"}</span>
          <button
            className="icon-button"
            disabled={!account}
            onClick={() => copy(account.solana)}
            aria-label="Copy Solana address"
          >
            <Copy size={13} />
          </button>
        </div>
        <div>
          <TokenIcon symbol="ETH" small />
          <span>{account ? short(account.ethereum) : "Ethereum address"}</span>
          <button
            className="icon-button"
            disabled={!account}
            onClick={() => copy(account.ethereum)}
            aria-label="Copy Ethereum address"
          >
            <Copy size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}
