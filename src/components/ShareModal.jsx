import { useState } from "react";

export default function ShareModal({
  open,
  onClose,
  url,
  title,
  description,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 max-h-[85vh] overflow-y-auto scrollbar-custom">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          {description}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={handleCopy}
            className="btn-primary text-sm whitespace-nowrap"
          >
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
      </div>
    </div>
  );
}