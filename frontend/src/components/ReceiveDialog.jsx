import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import QRCode from "qrcode";
import { Dialog, ErrorMessage } from "./ui";
import { networks } from "../lib/display";
export default function ReceiveDialog({
  account,
  network,
  copy,
  onClose,
  initialChain = "solana",
}) {
  const [chain, setChain] = useState(initialChain);
  const [qr, setQr] = useState(null);
  const [error, setError] = useState("");
  const address = account[chain];
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(address, {
      width: 240,
      margin: 2,
      color: { dark: "#211d35", light: "#ffffff" },
    })
      .then((data) => {
        if (active) setQr({ address, data });
      })
      .catch(() => {
        if (active)
          setError("Could not create QR code. Copy the address below.");
      });
    return () => {
      active = false;
    };
  }, [address]);
  return (
    <Dialog
      title="A place for your crypto."
      subtitle={`Receive into Account ${account.index + 1}.`}
      onClose={onClose}
    >
      <div className="segmented">
        {["solana", "ethereum"].map((item) => (
          <button
            key={item}
            className={chain === item ? "selected" : ""}
            onClick={() => setChain(item)}
          >
            {item === "solana" ? "Solana" : "Ethereum"}
          </button>
        ))}
      </div>
      <div className="qr-frame">
        {qr?.address === address ? (
          <img
            src={qr.data}
            width="220"
            height="220"
            alt={`${chain} receive address QR code`}
          />
        ) : (
          <span>Creating QR code…</span>
        )}
      </div>
      <p className="network-caption">
        <span className="status-dot" />
        {chain === "solana" ? "Solana" : "Ethereum"} ·{" "}
        {networks[network][chain]}
      </p>
      <code className="full-address">{address}</code>
      <button className="button primary full" onClick={() => copy(address)}>
        <Copy size={16} />
        Copy address
      </button>
      <ErrorMessage error={error} />
      <p className="field-help center">
        Only send assets on the network shown above.
        {network === "testnet" && " Test tokens have no monetary value."}
      </p>
    </Dialog>
  );
}
