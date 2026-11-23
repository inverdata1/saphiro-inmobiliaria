import { useEffect, useState } from "react";
import { apiGet } from "../../api";

function fecha(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  if (!y || !m || !d) return String(iso);
  return `${d}/${m}/${y}`;
}

function operacion(estado) {
  if (estado === "vacacional") return "Vacacional";
  if (estado === "alquiler_fijo") return "Alquiler fijo";
  return estado || "";
}

export default function ConsultaAlquileresPage() {
  const [edificios, setEdificios] = useState([]);
  const [edificio, setEdificio] = useState("");
  const [codigo, setCodigo] = useState("");
  const [filtro, setFiltro] = useState({ edificio: "", codigo: "" });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    setError("");
    apiGet("/inmuebles/consulta-alquileres", {
      edificio: filtro.edificio || undefined,
      codigo: filtro.codigo || undefined,
    })
      .then((res) => {
        if (!vivo) return;
        const data = res?.data || {};
        if (!filtro.edificio && !filtro.codigo) setEdificios(data.edificios || []);
        setRows(data.inmuebles || []);
      })
      .catch((err) => {
        if (!vivo) return;
        setRows([]);
        setError(err?.message || "No se pudo cargar la consulta");
      })
      .finally(() => {
        if (vivo) setLoading(false);
      });
    return () => {
      vivo = false;
    };
  }, [filtro]);

  function buscar(e) {
    e.preventDefault();
    const limpio = codigo.trim().toUpperCase();
    if (limpio && !/^[A-Z0-9]{4}$/.test(limpio)) {
      setError("El código interno debe tener 4 letras o números");
      return;
    }
    setError("");
    setFiltro({ edificio, codigo: limpio });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 text-slate-900 dark:text-slate-100">
      <h1 className="text-xl font-semibold">Consulta de alquileres</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Propiedades en alquiler fijo o vacacional. Filtra por edificio o por el código interno y revisa las fechas ocupadas.
      </p>

      <form onSubmit={buscar} className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-[1fr_160px_auto_auto]">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Edificio o conjunto</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            value={edificio}
            onChange={(e) => setEdificio(e.target.value)}
          >
            <option value="">Todos</option>
            {edificios.map((nombre) => (
              <option key={nombre} value={nombre}>{nombre}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Código</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase dark:border-slate-600 dark:bg-slate-800"
            value={codigo}
            maxLength={4}
            placeholder="AB12"
            onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Za-z0-9]/g, "").slice(0, 4))}
          />
        </label>
        <button type="submit" className="self-end rounded-lg bg-purple-800 px-4 py-2 text-sm font-medium text-white">
          Buscar
        </button>
        <button
          type="button"
          className="self-end rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
          onClick={() => {
            setEdificio("");
            setCodigo("");
            setError("");
            setFiltro({ edificio: "", codigo: "" });
          }}
        >
          Limpiar
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-4 text-sm text-slate-500">Cargando…</p>}

      {!loading && !rows.length && !error && (
        <p className="mt-4 text-sm text-slate-500">No hay propiedades en alquiler con ese filtro.</p>
      )}

      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const ocupaciones = Array.isArray(row.ocupaciones) ? row.ocupaciones : [];
          return (
            <article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold">{row.titulo}</h2>
                <span className="text-xs font-medium uppercase tracking-wide text-purple-800 dark:text-purple-300">
                  {operacion(row.estado_inmueble)}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {[
                  row.edificio_nombre,
                  row.piso ? `Piso ${row.piso}` : "",
                  row.numero_apto ? `Apto ${row.numero_apto}` : "",
                  row.codigo_interno ? `Código ${row.codigo_interno}` : "Sin código",
                  row.ciudad,
                ].filter(Boolean).join(" · ")}
              </p>
              {ocupaciones.length === 0 ? (
                <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">Libre: no tiene fechas ocupadas.</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100 text-sm dark:divide-slate-800">
                  {ocupaciones.map((oc, i) => (
                    <li key={`${row.id}-${i}`} className="flex flex-wrap justify-between gap-2 py-1.5">
                      <span>
                        {fecha(oc.desde)} al {fecha(oc.hasta)}
                        {oc.cliente ? ` · ${oc.cliente}` : ""}
                      </span>
                      <span className="text-xs text-slate-500">{oc.tipo === "fijo" ? "Contrato" : "Reserva"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
