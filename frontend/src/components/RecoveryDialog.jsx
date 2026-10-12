import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Dialog } from "./ui";
export default function RecoveryDialog({ mnemonic, onClose }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(onClose, 60000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <Dialog
      title="Your recovery phrase."
      subtitle="Anyone with these words can control your accounts. Keep them private."
      onClose={onClose}
    >
      <div className="word-grid">
        {mnemonic.split(" ").map((word, index) => (
          <div key={index}>
            <span>{index + 1}</span>
            {visible ? word : "••••••"}
          </div>
        ))}
      </div>
      <button
        className="button subtle full"
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        {visible ? "Hide phrase" : "Show phrase"}
      </button>
      <p className="private-note">
        This window closes automatically after one minute.
      </p>
    </Dialog>
  );
}
