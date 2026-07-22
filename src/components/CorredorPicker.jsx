import { useState, useEffect, useRef } from "react";
import { apiGet } from "../api";
import Modal from "./Modal";

export default function CorredorPicker({ value, onChange, selectedItem }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [corredores, setCorredores] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const loadedRef = useRef(false);

  async function fetchCorredores(q) {
    try {
      const params = { };
      if (q) params.q = q;
      const r = await apiGet("/corredores", params);
      setCorredores(r.data || []);
      loadedRef.current = true;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!showModal) return;
    if (!loadedRef.current) setLoading(true);
    fetchCorredores("");
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCorredores(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  function handleSelect(c) {
    onChange?.(c.id, c);
    setShowModal(false);
    setSearch("");
  }

  function handleClear() {
    onChange?.(null);
  }

  const effectiveSelected = selectedItem;

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex-1 text-left border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 text-sm"
        >
          {effectiveSelected ? (
            <div className="truncate">
              <span className="sm:hidden">#{effectiveSelected.id} - {effectiveSelected.corredor_nombre}</span>
              <span className="hidden sm:inline">#{effectiveSelected.id} - {effectiveSelected.corredor_nombre} - {effectiveSelected.corredor_email}</span>
            </div>
          ) : value ? `#${value}` : "Seleccionar corredor"}
        </button>
        {effectiveSelected ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 shrink-0"
            title="Limpiar selección"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setSearch(""); }} backdropClassName="flex items-end justify-center sm:grid sm:place-items-center" className="w-full sm:max-w-xl max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700">
            <div className="flex items-start justify-between p-4 sm:p-6 pb-0">
              <div>
                <div className="text-lg font-extrabold dark:text-slate-100">Seleccionar corredor</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{corredores.length} resultado(s)</div>
              </div>
              <button
                type="button"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                onClick={() => { setShowModal(false); setSearch(""); }}
              >
                ✕
              </button>
            </div>

            <div className="px-4 sm:px-6 pt-4">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
                placeholder="Buscar por nombre, email o ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4 scrollbar-custom">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
                  ))}
                </div>
              ) : corredores.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-10">No se encontraron corredores</div>
              ) : (
                <div className="space-y-2">
                  {corredores.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelect(c)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800 ${
                        value == c.id
                          ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {String(c.corredor_nombre || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{c.corredor_nombre || "Sin nombre"}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.corredor_email || "-"}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-slate-400 dark:text-slate-500">#{c.id}</div>
                        {c.licencia_nro ? (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">Lic: {c.licencia_nro}</div>
                        ) : null}
                      </div>
                      {value == c.id ? (
                        <div className="rounded-full bg-blue-500 p-1 shrink-0">
                          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
      </Modal>
    </>
  );
}
