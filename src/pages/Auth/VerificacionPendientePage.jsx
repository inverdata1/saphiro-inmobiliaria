import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { apiPost } from "../../api";

export default function VerificacionPendientePage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [err, setErr] = useState("");

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setResendSuccess(false);
    setErr("");
    try {
      await apiPost("/auth/resend-verification", { email });
      setResendSuccess(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="card p-6 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Verifica tu correo
          </h2>
          {email ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tu cuenta aún no está activada. Hemos enviado un enlace de verificación a{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tu cuenta aún no está activada. Revisa tu correo y haz clic en el
              enlace de verificación para poder iniciar sesión.
            </p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500">
            El enlace expira en 24 horas. Si no lo encuentras, revisa tu carpeta de spam.
          </p>

          {resendSuccess && (
            <div className="p-3 rounded-xl border bg-green-50 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Correo reenviado exitosamente
            </div>
          )}

          {err && (
            <div className="p-3 rounded-xl border bg-red-50 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {err}
            </div>
          )}

          {email && (
            <button
              onClick={handleResend}
              disabled={resending}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              {resending ? "Reenviando…" : "Reenviar correo de verificación"}
            </button>
          )}

          <Link
            to="/login"
            className="block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
