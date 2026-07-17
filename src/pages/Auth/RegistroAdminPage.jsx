import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { apiGet, apiPost } from "../../api";

export default function RegistroAdminPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({
    nombre: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    (async () => {
      try {
        const res = await apiGet(`/auth/registro-token/admin/${token}`);
        setEmail(res.data?.email || "");
        setTokenValido(true);
      } catch {
        setTokenValido(false);
      } finally {
        setValidating(false);
      }
    })();
  }, [token]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (form.password !== form.confirmPassword) {
      setErr("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await apiPost("/auth/register/admin/completar", {
        token,
        nombre: form.nombre,
        password: form.password,
      });
      navigate("/login");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="animate-pulse text-sm text-slate-500 dark:text-slate-400">Validando enlace…</div>
      </div>
    );
  }

  if (!token || !tokenValido) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400">Enlace inválido</div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Este enlace es inválido o ha expirado. Solicita una nueva invitación de administrador para recibir otro enlace.
          </p>
          <Link to="/login" className="mt-4 inline-block btn-primary">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Completar registro
          </div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Administrador: <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {err && (
            <div className="p-3 rounded-xl border bg-red-50 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {err}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Nombre completo
            </label>
            <input
              type="text"
              name="nombre"
              required
              autoComplete="name"
              value={form.nombre}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
              placeholder="Nombre del administrador"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Confirmar contraseña
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? "Registrando…" : "Completar registro"}
          </button>
        </form>
      </div>
    </div>
  );
}
