import { useEffect, useState } from "react";
import { apiPost, apiGet, apiPatch, apiPut, apiDelete } from "../api";
import DataTable from "../components/DataTable";
import ErrorBanner from "../components/ErrorBanner";

export default function CorredoresPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [err, setErr] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const [showView, setShowView] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resettingId, setResettingId] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});

  const filtered = rows.filter(
    (r) =>
      r.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.telefono?.includes(search)
  );

  async function load(){
    setFetching(true);
    try {
      const res = await apiGet("/corredores");
      const mapped = (res.data || []).map((item) => ({
        id: item.id,
        nombre: item.corredor_nombre || "—",
        email: item.corredor_email,
        telefono: item.telefono || "—",
        licencia: item.licencia_nro || "—",
        comisionBase: item.comision_base,
        activo: item.active,
      }));
      setRows(mapped);
    } catch (e) {
      setErr(e.message);
    } finally {
      setFetching(false);
    }
  }


  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!email || !porcentaje) return;
    setLoading(true);
    setErr("");
    try {
      await apiPost("/auth/register/corredor", { email, porcentaje: Number(porcentaje) });
      setEmail("");
      setPorcentaje("");
      setShowModal(false);
      load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActivo(id) {
    try {
      const res = await apiPatch(`/corredores/${id}/toggle-activo`);
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, activo: res.data.active } : r))
      );
    } catch (e) {
      setErr(e.message);
    }
  }

  function confirmDelete(r) {
    setDeleteTarget(r);
  }

  async function handleReinvitar(id) {
    setResettingId(id);
    setErr("");
    try {
      await apiPost("/auth/register/corredor/reinvitar", { id });
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setResettingId(null);
    }
  }

  function openEdit(r) {
    setEditTarget(r);
    setEditForm({ comisionBase: r.comisionBase ?? "" });
  }

  async function handleUpdate() {
    if (!editTarget) return;
    setLoading(true);
    setErr("");
    try {
      await apiPut(`/corredores/${editTarget.id}`, {
        comision_base: editForm.comisionBase !== "" ? Number(editForm.comisionBase) : null,
      });
      setEditTarget(null);
      load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await apiDelete(`/corredores/${deleteTarget.id}`);
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
          <div className="text-2xl font-extrabold dark:text-slate-100">Corredores</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Gestión de corredores del sistema.</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={fetching}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
            title="Recargar"
          >
            <svg className={`h-5 w-5 ${fetching ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Crear corredor
          </button>
        </div>
      </div>

      <ErrorBanner message={err} onClose={() => setErr("")} />

      <div className="mt-6">
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
          placeholder="Buscar por nombre, email o teléfono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-4 bg-white border rounded-2xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <DataTable
          columns={[
            { key: "id", header: "ID" },
            { key: "nombre", header: "Nombre" },
            { key: "email", header: "Email" },
            { key: "telefono", header: "Teléfono" },
            { key: "comisionBase", header: "Comisión base", render: (r) => r.comisionBase != null ? `${r.comisionBase}%` : "—" },
            {
              key: "activo",
              header: "Estado",
              className: "w-28",
              render: (r) => (
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    r.activo
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  }`}
                >
                  {r.activo ? "Activo" : "Inactivo"}
                </span>
              ),
            },
            {
              key: "acciones",
              header: "Acciones",
              render: (r) => (
                <div className="flex items-center justify-center gap-1">
                  {r.nombre === "—" && (
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
                  )}
                  <button
                    onClick={() => toggleActivo(r.id)}
                    className={`rounded-lg p-2 transition-colors ${
                      r.activo
                        ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                    }`}
                    title={r.activo ? "Inhabilitar" : "Habilitar"}
                  >
                    {r.activo ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(r)}
                    className="rounded-lg bg-violet-50 p-2 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400"
                    title="Editar corredor"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
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
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-extrabold dark:text-slate-100">Crear corredor</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Datos del nuevo corredor.</div>
              </div>
              <button
                type="button"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                onClick={() => { setShowModal(false); setEmail(""); setPorcentaje(""); }}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
                  placeholder="corredor@correo.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Porcentaje de comisión</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={porcentaje}
                  onChange={(e) => setPorcentaje(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
                  placeholder="3.5"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => { setShowModal(false); setEmail(""); setPorcentaje(""); }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary disabled:opacity-60"
                  disabled={!email || !porcentaje}
                  onClick={handleCreate}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showView ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={() => setShowView(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-extrabold dark:text-slate-100">Datos del corredor</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Información del corredor seleccionado.</div>
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
                ["ID", showView.id],
                ["Nombre", showView.nombre],
                ["Email", showView.email],
                ["Teléfono", showView.telefono || "—"],
                ["Licencia", showView.licencia],
                ["Comisión base", showView.comisionBase != null ? `${showView.comisionBase}%` : "—"],
                ["Estado", showView.activo ? "Activo" : "Inactivo"],
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
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-extrabold dark:text-slate-100">¿Eliminar corredor?</div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Esta acción no se puede deshacer. Se eliminará a <strong>{deleteTarget.nombre}</strong> ({deleteTarget.email}) del sistema.
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
          </div>
        </div>
      ) : null}

      {editTarget ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={() => setEditTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-extrabold dark:text-slate-100">Editar corredor</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{editTarget.nombre}</div>
              </div>
              <button
                type="button"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                onClick={() => setEditTarget(null)}
              >
                ✕
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Comisión base (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editForm.comisionBase}
                  onChange={(e) => setEditForm({ ...editForm, comisionBase: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => setEditTarget(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary disabled:opacity-60"
                  disabled={loading}
                  onClick={handleUpdate}
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
