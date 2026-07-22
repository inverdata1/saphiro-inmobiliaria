import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../api";
import DataTable from "../components/DataTable";
import { formatDate } from "../utils/date";
import ErrorBanner from "../components/ErrorBanner";
import Modal from "../components/Modal";

export default function UsuariosAdminPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [err, setErr] = useState("");
  const [showView, setShowView] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resettingId, setResettingId] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const filtered = rows;

  async function load(q, p) {
    setFetching(true);
    try {
      const offset = ((p || page) - 1) * limit;
      const params = new URLSearchParams({ isAdmin: "true", limit: String(limit), offset: String(offset) });
      if (q) params.set("q", q);
      const res = await apiGet(`/usuarios?${params}`);
      setRows(res.data || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    load(search, 1);
  }, []);

  async function handleCreate() {
    if (!createEmail) return;
    setLoading(true);
    setErr("");
    try {
      await apiPost("/auth/register/admin/invitar", {
        email: createEmail,
      });
      setCreateEmail("");
      setShowCreate(false);
      setPage(1);
      await load(search, 1);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete(r) {
    setDeleteTarget(r);
  }

  async function handleReinvitar(id) {
    setResettingId(id);
    setErr("");
    try {
      await apiPost("/auth/register/admin/reinvitar", { id });
      await load(search, page);
    } catch (e) {
      setErr(e.message);
    } finally {
      setResettingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await apiDelete(`/usuarios/${deleteTarget.id}`);
      setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <div className="text-2xl font-extrabold dark:text-slate-100">Administradores</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Gestión de administradores del sistema.</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(search, page)}
            disabled={fetching}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
            title="Recargar"
          >
            <svg className={`h-5 w-5 ${fetching ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Crear administrador
          </button>
        </div>
      </div>

      <ErrorBanner message={err} onClose={() => setErr("")} />

      <div className="mt-6">
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              load(search, 1);
            }
          }}
        />
      </div>

      <div className="mt-4 bg-white border rounded-2xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <DataTable
          columns={[
            { key: "id", header: "ID" },
            { key: "nombre", header: "Nombre", render: (r) => r.nombre || "-" },
            { key: "email", header: "Email" },
            {
              key: "fecha_registro",
              header: "Fecha de registro",
              render: (r) => formatDate(r.fecha_registro),
            },
            {
              key: "acciones",
              header: "Acciones",
              render: (r) => (
                <div className="flex items-center justify-center gap-1">
                  {!r.nombre ? (
                    <button
                      onClick={() => handleReinvitar(r.id)}
                      disabled={resettingId === r.id}
                      className="rounded-lg bg-amber-50 p-2 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 disabled:opacity-50"
                      title="Reenviar código de registro"
                    >
                      {resettingId === r.id ? (
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                    </button>
                  ) : null}
                  <button
                    onClick={() => setShowView(r)}
                    className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                    title="Ver datos"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => confirmDelete(r)}
                    className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                    title="Eliminar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ),
            },
          ]}
          rows={filtered}
        />
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>Página {page}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1 || fetching}
              onClick={() => { const p = page - 1; setPage(p); load(search, p); }}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              ← Anterior
            </button>
            <button
              disabled={rows.length < limit || fetching}
              onClick={() => { const p = page + 1; setPage(p); load(search, p); }}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setCreateEmail(""); }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-extrabold dark:text-slate-100">Crear administrador</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Correo del nuevo administrador.</div>
              </div>
              <button
                type="button"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                onClick={() => { setShowCreate(false); setCreateEmail(""); }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
                  placeholder="admin@correo.com"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => { setShowCreate(false); setCreateEmail(""); }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary disabled:opacity-60"
                  disabled={!createEmail || loading}
                  onClick={handleCreate}
                >
                  Aceptar
                </button>
              </div>
            </div>
      </Modal>

      <Modal open={!!showView} onClose={() => setShowView(null)} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-extrabold dark:text-slate-100">Datos del usuario</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Información del usuario seleccionado.</div>
              </div>
              <button
                type="button"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                onClick={() => setShowView(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ["ID", showView?.id],
                ["Nombre", showView?.nombre],
                ["Email", showView?.email],
                ["Fecha de registro", formatDate(showView?.fecha_registro)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                onClick={() => setShowView(null)}
              >
                Cerrar
              </button>
            </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700">
            <div className="text-lg font-extrabold dark:text-slate-100">¿Eliminar usuario?</div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Esta acción no se puede deshacer. Se eliminará a <strong>{deleteTarget?.nombre}</strong> ({deleteTarget?.email}) del sistema.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                onClick={handleDelete}
              >
                Eliminar
              </button>
            </div>
      </Modal>
    </div>
  );
}
