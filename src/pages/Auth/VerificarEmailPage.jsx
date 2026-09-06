import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { apiPost } from "../../api";

export default function VerificarEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErr("Token no proporcionado");
      return;
    }

    (async () => {
      try {
        const res = await apiPost("/auth/verify-email", { token });
        setStatus("success");
      } catch (e) {
        setStatus("error");
        setErr(e.message);
      }
    })();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Verificando tu correo...
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="card p-6 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Correo verificado
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tu correo ha sido verificado exitosamente. Ya puedes iniciar
              sesión con tu cuenta.
            </p>
            <Link to="/" className="btn-primary inline-flex justify-center w-full">
              Ir al inicio
            </Link>
            <Link
              to="/inmuebles"
              className="block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
            >
              Ver inmuebles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="card p-6 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Error de verificación
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {err || "El enlace de verificación es inválido o ha expirado."}
          </p>
          <Link
            to="/register"
            className="btn-primary inline-flex justify-center"
          >
            Volver a registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}
