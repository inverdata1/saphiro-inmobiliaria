import { useEffect, useState } from "react";
import { apiGet } from "../api";
import DataTable from "../components/DataTable";
import UsuarioPicker from "../components/UsuarioPicker";
import ErrorBanner from "../components/ErrorBanner";
import SerieChart from "../components/charts/SerieChart";
import TopCorredoresBar from "../components/charts/TopCorredoresBar";
import { formatDateTime } from "../utils/date";

function money(n, moneda) {
  const num = Number(n || 0).toLocaleString("en-US");
  const m = (moneda || "USD").toUpperCase();
  if (m === "EUR") return `${num}€`;
  if (m === "BS") return `${num} Bs.`;
  return `$${num}`;
}

export default function BitacoraPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tabla, setTabla] = useState("");
  const [accion, setAccion] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [usuarioSel, setUsuarioSel] = useState(null);
  const [moneda, setMoneda] = useState("USD");

  const [kpis, setKpis] = useState(null);
  const [serie, setSerie] = useState([]);
  const [top, setTop] = useState([]);
  const [dashDesde, setDashDesde] = useState("");
  const [dashHasta, setDashHasta] = useState("");

  const cards = [
    { title: "Transacciones", value: kpis?.transacciones_count ?? "—" },
    { title: "Monto total", value: kpis ? money(kpis.monto_total_sum, moneda) : "—" },
    { title: "Comisiones", value: kpis ? money(kpis.comision_total_sum, moneda) : "—" },
    { title: "Ganancia empresa", value: kpis ? money(kpis.ganancia_empresa_sum, moneda) : "—" },
    { title: "Transacciones Pagadas", value: kpis ? money(kpis.monto_total_pagado, moneda) : "—" },
    { title: "Transacciones Pendientes", value: kpis ? money(kpis.monto_total_pendiente, moneda) : "—" },
    { title: "pago promedio", value: kpis ? money(kpis.ticket_promedio, moneda) : "—" },
  ];

  async function load() {
    setLoading(true);
    setErr("");
    if (desde && hasta && hasta < desde) {
      setErr("La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'.");
      setLoading(false);
      return;
    }
    try {
      const r = await apiGet("/auditoria", {
        desde: desde || undefined,
        hasta: hasta || undefined,
        tabla_afectada: tabla || undefined,
        accion: accion || undefined,
        usuario_id: usuarioId || undefined,
        limit: 200,
      });
      setRows(r.data || r);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    if (dashDesde && dashHasta && dashHasta < dashDesde) {
      setErr("La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'.");
      return;
    }
    try {
      const params = {
        desde: dashDesde || undefined,
        hasta: dashHasta || undefined,
      };
      const [k, s, t] = await Promise.all([
        apiGet("/dashboard/kpis", params),
        apiGet("/dashboard/serie", params),
        apiGet("/dashboard/top-corredores", { ...params, limit: 5 }),
      ]);

      setKpis(k.data);
      setSerie(s.data || []);
      setTop(t.data || []);
    } catch (error) {
      setErr(error.message || "Error cargando estadísticas");
    }
  }

  useEffect(() => {
    load();
    loadStats();
  }, []); // eslint-disable-line

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <div className="text-2xl font-extrabold dark:text-slate-100">Bitacora</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Bitácora, actividades y estadísticas del negocio.</div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex rounded-xl border dark:border-slate-600 overflow-hidden">
            {["USD", "EUR", "BS"].map((m) => (
              <button
                key={m}
                onClick={() => setMoneda(m)}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  moneda === m
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <button onClick={() => { load(); loadStats(); }} disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? "..." : "Actualizar"}
          </button>
        </div>
      </div>

      <ErrorBanner message={err} onClose={() => setErr("")} />

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border rounded-2xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="font-bold mb-3 dark:text-slate-100">Filtros dashboard</div>
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Desde</div>
                <input className="border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600" type="date" value={dashDesde} onChange={(e) => setDashDesde(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Hasta</div>
                <input className="border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600" type="date" value={dashHasta} onChange={(e) => setDashHasta(e.target.value)} />
              </div>
              <button onClick={loadStats} className="btn-secondary disabled:opacity-60">
                Aplicar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map((c) => (
              <div key={c.title} className="bg-white border rounded-2xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">{c.title}</div>
                <div className="text-xl font-extrabold mt-1 dark:text-slate-100">{c.value}</div>
              </div>
            ))}
          </div>

          <SerieChart data={serie} />

          <div className="bg-white border rounded-2xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="font-bold mb-3 dark:text-slate-100">Top corredores</div>
            <TopCorredoresBar data={top} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border rounded-2xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="font-bold mb-3 dark:text-slate-100">Filtros</div>

            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Desde</div>
                <input className="border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Hasta</div>
                <input className="border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tabla</div>
                <select className="border rounded-xl px-3 py-2 bg-white w-40 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600" value={tabla} onChange={(e) => setTabla(e.target.value)}>
                  <option value="">Todas</option>
                  <option value="usuarios">usuarios</option>
                  <option value="corredores">corredores</option>
                  <option value="inmuebles">inmuebles</option>
                  <option value="transacciones">transacciones</option>
                  <option value="comisiones">comisiones</option>
                  <option value="guardados">guardados</option>
                  <option value="resenas">reseñas</option>
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Acción</div>
                <select className="border rounded-xl px-3 py-2 bg-white w-40 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600" value={accion} onChange={(e) => setAccion(e.target.value)}>
                  <option value="">Todas</option>
                  <option value="INSERT">INSERT</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Usuario ID</div>
                <div className="max-w-[360px]">
                  <UsuarioPicker
                    includeAdmins
                    value={usuarioId}
                    selectedItem={usuarioSel}
                    onChange={(id, item) => {
                      setUsuarioId(id);
                      setUsuarioSel(item || null);
                    }}
                  />
                </div>
                <button onClick={load} disabled={loading} className="btn-secondary disabled:opacity-60 mt-2">
                  Aplicar
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="font-bold mb-3 dark:text-slate-100">Logs</div>
            <DataTable
              columns={[
                { key: "id", header: "ID" },
                { key: "fecha_hora", header: "Fecha", render: (r) => formatDateTime(r.fecha_hora) },
                { key: "usuario_nombre", header: "Usuario" },
                { key: "usuario_id", header: "ID Usuario" },
                { key: "accion", header: "Acción" },
                { key: "tabla_afectada", header: "Tabla" },
                { key: "descripcion", header: "Descripción" },
                { key: "ip_address", header: "IP" },
              ]}
              rows={rows}
            />
          </div>
        </div>
      </div>
    </div>
  );
}