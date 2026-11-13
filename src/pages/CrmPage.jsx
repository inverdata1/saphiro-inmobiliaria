import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch, apiPost } from "../api";
import ErrorBanner from "../components/error/ErrorBanner";

const ETAPAS = [
  ["nuevo", "Nuevo"],
  ["contactado", "Contactado"],
  ["visita", "Visita"],
  ["negociacion", "Negociación"],
  ["cerrado", "Cerrado"],
];

const TABS = [
  ["tablero", "Tablero"],
  ["leads", "Leads"],
  ["propiedades", "Propiedades"],
  ["clientes", "Clientes"],
  ["citas", "Citas"],
];

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function dinero(n) {
  return Number(n || 0).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CrmPage() {
  const [tab, setTab] = useState("tablero");
  const [resumen, setResumen] = useState(null);
  const [leads, setLeads] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [err, setErr] = useState("");
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", inmueble_id: "", valor: "" });

  async function cargar() {
    const [r, l, p, c, a] = await Promise.all([
      apiGet("/crm/resumen"),
      apiGet("/crm/leads"),
      apiGet("/crm/propiedades"),
      apiGet("/crm/clientes"),
      apiGet("/crm/citas"),
    ]);
    setResumen(r.data);
    setLeads(l.data || []);
    setPropiedades(p.data || []);
    setClientes(c.data || []);
    setCitas(a.data || []);
  }

  useEffect(() => {
    cargar().catch((e) => setErr(e.message));
  }, []);

  async function mover(id, etapa) {
    setErr("");
    try {
      await apiPatch(`/crm/leads/${id}`, { etapa });
      setLeads((rows) => rows.map((row) => (row.id === id ? { ...row, etapa } : row)));
    } catch (e) {
      setErr(e.message);
    }
  }

  function paso(id, etapa, delta) {
    const index = ETAPAS.findIndex(([codigo]) => codigo === etapa);
    const next = ETAPAS[index + delta];
    if (next) mover(id, next[0]);
  }

  async function crear(e) {
    e.preventDefault();
    setErr("");
    try {
      await apiPost("/crm/leads", { ...form, inmueble_id: Number(form.inmueble_id) });
      setForm({ nombre: "", telefono: "", email: "", inmueble_id: "", valor: "" });
      await cargar();
    } catch (error) {
      setErr(error.message);
    }
  }

  const serie = (resumen?.meses || []).map(Number);
  const tope = Math.max(...serie, 0);
  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return propiedades;
    return propiedades.filter((p) => `${p.titulo} ${p.ciudad || ""}`.toLowerCase().includes(q));
  }, [propiedades, busca]);

  const tarjetas = resumen
    ? [
        ["Ventas del mes", `$${dinero(resumen.monto_usd_mes)}`, `${resumen.ventas_mes} pagos`],
        ["Leads activos", String(resumen.leads_activos), `${resumen.leads_hoy} hoy`],
        ["Cartera", String(resumen.cartera), `${resumen.destacados} destacados`],
        ["Visitas", String(resumen.visitas_semana), `${resumen.visitas_hoy} hoy`],
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-extrabold dark:text-white">CRM</h1>
      <p className="mt-1 text-sm text-slate-500">Tus leads, inmuebles, clientes y reservas. Cada número sale de tu cuenta.</p>
      <ErrorBanner message={err} onClose={() => setErr("")} />
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? "bg-[#5a0e82] text-white" : "bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>{label}</button>
        ))}
      </div>

      {tab === "tablero" ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tarjetas.map(([label, value, detail]) => (
              <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
                <div className="mt-2 text-2xl font-extrabold dark:text-white" data-no-i18n>{value}</div>
                <p className="text-xs text-slate-500">{detail}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
              <h2 className="font-extrabold dark:text-white">Rendimiento del año</h2>
              <p className="text-xs text-slate-500">Ventas pagadas en USD, mes a mes.</p>
              {tope === 0 ? <p className="mt-6 text-sm text-slate-500">Este año todavía no hay ventas pagadas.</p> : (
                <div className="mt-4 flex h-48 items-end gap-1">
                  {serie.map((monto, i) => (
                    <div key={MESES[i]} className="flex h-full flex-1 flex-col justify-end">
                      <div className="rounded-t bg-[#5a0e82]" style={{ height: `${Math.max(4, (monto / tope) * 100)}%` }} title={`${monto}`} />
                      <span className="mt-1 text-center text-[10px] text-slate-500">{MESES[i]}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="font-extrabold dark:text-white">Últimos leads</h2>
              <div className="mt-3 space-y-3">
                {leads.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="border-b border-slate-100 pb-2 dark:border-slate-800">
                    <div className="font-bold dark:text-white">{lead.nombre || `Consulta ${lead.tipo}`}</div>
                    <div className="text-xs text-slate-500">{lead.inmueble || "Sin inmueble"}</div>
                  </div>
                ))}
                {leads.length === 0 ? <p className="text-sm text-slate-500">Vacío</p> : null}
              </div>
              <button type="button" onClick={() => setTab("leads")} className="mt-4 w-full rounded-xl bg-slate-900 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-900">Ver embudo</button>
            </section>
          </div>
        </div>
      ) : null}

      {tab === "leads" ? (
        <div className="mt-4">
          <form onSubmit={crear} className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-6">
            <input required placeholder="Nombre" className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <input placeholder="Teléfono" className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            <input placeholder="Correo" className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select required className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" value={form.inmueble_id} onChange={(e) => setForm({ ...form, inmueble_id: e.target.value })}>
              <option value="">Inmueble</option>
              {propiedades.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
            </select>
            <input placeholder="Valor USD" className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
            <button className="rounded-xl bg-[#5a0e82] font-bold text-white">Agregar</button>
          </form>
          <div className="mt-4 grid gap-3 lg:grid-cols-5">
            {ETAPAS.map(([codigo, label]) => (
              <section key={codigo} className="rounded-2xl bg-slate-100 p-2 dark:bg-slate-800">
                <h2 className="px-1 text-sm font-bold dark:text-white">{label} <span data-no-i18n>{leads.filter((l) => l.etapa === codigo).length}</span></h2>
                <div className="mt-2 space-y-2">
                  {leads.filter((l) => l.etapa === codigo).map((lead) => (
                    <article key={lead.id} className="rounded-xl bg-white p-3 text-sm dark:bg-slate-900">
                      <div className="font-bold dark:text-white">{lead.nombre || `Consulta ${lead.tipo}`}</div>
                      <div className="text-xs text-slate-500">{lead.inmueble || "Sin inmueble"}</div>
                      {lead.telefono ? <div className="text-xs" data-no-i18n>{lead.telefono}</div> : null}
                      {lead.valor != null ? <div className="text-xs font-bold text-emerald-600" data-no-i18n>${dinero(lead.valor)}</div> : null}
                      <div className="mt-2 flex justify-between text-xs font-bold">
                        <button type="button" onClick={() => paso(lead.id, lead.etapa, -1)} className="text-slate-500">Atrás</button>
                        <button type="button" onClick={() => paso(lead.id, lead.etapa, 1)} className="text-[#5a0e82]">Avanzar</button>
                      </div>
                    </article>
                  ))}
                  {leads.filter((l) => l.etapa === codigo).length === 0 ? <p className="px-1 text-xs text-slate-500">Vacío</p> : null}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "propiedades" ? (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="p-3">
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar" className="w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="p-3">Inmueble</th><th>Ciudad</th><th>Tipo</th><th>Precio</th><th>Estatus</th></tr></thead>
            <tbody>
              {filtradas.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-3 font-semibold dark:text-white">{p.titulo}</td>
                  <td>{p.ciudad || "—"}</td>
                  <td>{p.estado_inmueble}</td>
                  <td data-no-i18n>{p.moneda} {dinero(p.precio)}</td>
                  <td>{p.estatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtradas.length === 0 ? <p className="p-4 text-sm text-slate-500">No tienes inmuebles publicados.</p> : null}
        </div>
      ) : null}

      {tab === "clientes" ? (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="p-3">Cliente</th><th>Correo</th><th>Pagos</th><th>Último</th></tr></thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-3 font-semibold dark:text-white">{c.nombre}</td>
                  <td data-no-i18n>{c.email}</td>
                  <td data-no-i18n>{c.pagos}</td>
                  <td data-no-i18n>{c.ultimo ? String(c.ultimo).slice(0, 10) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {clientes.length === 0 ? <p className="p-4 text-sm text-slate-500">Todavía no hay clientes con una transacción en tus inmuebles.</p> : null}
        </div>
      ) : null}

      {tab === "citas" ? (
        <div className="mt-4 space-y-2">
          {citas.map((cita) => (
            <article key={cita.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="font-bold dark:text-white">{cita.inmueble}</div>
              <p className="text-sm text-slate-600 dark:text-slate-300"><span data-no-i18n>{String(cita.fecha_entrada).slice(0, 10)} → {String(cita.fecha_salida).slice(0, 10)}</span> · {cita.cliente || "Cliente"} · <span data-no-i18n>{cita.num_huespedes}</span> huéspedes</p>
            </article>
          ))}
          {citas.length === 0 ? <p className="text-sm text-slate-500">No hay reservas vigentes.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
