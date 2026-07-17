export default function ErrorBanner({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="mt-4 p-3 rounded-xl border bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-between">
      <span>{message}</span>
      {onClose ? (
        <button onClick={onClose} className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">✕</button>
      ) : null}
    </div>
  );
}
