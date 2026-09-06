import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiPost } from "../api";

export default function VerificarEmailBanner() {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [err, setErr] = useState("");

  if (!user || user.email_verified) return null;

  async function handleResend() {
    setResending(true);
    setResendSuccess(false);
    setErr("");
    try {
      await apiPost("/auth/resend-verification", { email: user.email });
      setResendSuccess(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Tu correo no está verificado.{" "}
            <span className="hidden sm:inline">Revisa tu bandeja de entrada o haz clic para reenviar.</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {resendSuccess && (
            <span className="text-xs text-green-600 dark:text-green-400">Enviado</span>
          )}
          {err && (
            <span className="text-xs text-red-600 dark:text-red-400">{err}</span>
          )}
          <button
            onClick={handleResend}
            disabled={resending}
            className="shrink-0 text-sm font-semibold text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200 disabled:opacity-50 cursor-pointer"
          >
            {resending ? "Enviando..." : "Reenviar correo"}
          </button>
        </div>
      </div>
    </div>
  );
}
