import { useEffect, useState } from "react";
import { apiGet, apiPatch, apiPost, apiUpload } from "../api";
import ErrorBanner from "../components/error/ErrorBanner";

const PLANES = [
  ["basico", "Básico", "Hasta 3 activos", "Gratis", "Perfil público y leads por WhatsApp"],
  ["pro", "Corredor Pro", "Hasta 15 activos", "$15 / mes o $144 / año", "1 destacado al mes, estadísticas y gestión vacacional"],
  ["pyme", "Inmobiliaria Pyme", "Hasta 50 activos", "$35 / mes o $336 / año", "3 destacados, hasta 3 asesores y badge verificada"],
  ["enterprise", "Enterprise", "Ilimitados", "$75 / mes o $720 / año", "10 destacados, subcuentas ilimitadas, soporte y reportes"],
];

export default function PlanesPage() {
  const [corredores, setCorredores] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [inmuebleId, setInmuebleId] = useState("");
  const [anuncio, setAnuncio] = useState({ titulo: "", empresa: "", enlace: "", posicion: "carrusel", corredor_id: "" });
  const [oficina, setOficina] = useState(null);
  const [respuesta, setRespuesta] = useState({});

  async function load() {
    const [r, o] = await Promise.all([apiGet("/planes/corredores"), apiGet("/planes/oficina")]);
    setCorredores(r.data || []);
    setOficina(o.data || null);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  async function guardar(row, patch) {
    setErr("");
    setMsg("");
    try {
      await apiPatch(`/planes/corredores/${row.id}`, {
        plan_codigo: patch.plan_codigo ?? row.plan_codigo,
        plan_pagado: patch.plan_pagado ?? row.plan_pagado,
        publicaciones_extra: patch.publicaciones_extra ?? row.publicaciones_extra,
        opcion_vacacional: patch.opcion_vacacional ?? row.opcion_vacacional,
        porcentaje_vacacional: patch.porcentaje_vacacional ?? row.porcentaje_vacacional,
        ciclo: patch.ciclo,
      });
      setMsg("Plan actualizado.");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function boost(path) {
    setErr("");
    setMsg("");
    try {
      const r = await apiPost(path, { inmueble_id: Number(inmuebleId) });
      const cobro = r?.data?.cobro;
      setMsg(
        cobro === "incluido"
          ? "Destacado incluido en el plan, por 7 días."
          : path.endsWith("destacar")
            ? "Destacado cobrado: $5, por 7 días."
            : "Re-post cobrado: $2. La publicación subió al inicio."
      );
    } catch (e) {
      setErr(e.message);
    }
  }

  async function publicarAnuncio(e) {
    e.preventDefault();
    setErr("");
    try {
      await apiPost("/planes/anuncios", { ...anuncio, corredor_id: anuncio.corredor_id ? Number(anuncio.corredor_id) : undefined });
      setAnuncio({ titulo: "", empresa: "", enlace: "", posicion: anuncio.posicion, corredor_id: "" });
      setMsg(anuncio.posicion === "lateral" ? "Banner cobrado: $15, vigente 1 mes." : "Anuncio publicado por 1 mes.");
      await load();
    } catch (err2) {
      setErr(err2.message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-extrabold dark:text-slate-100">Planes</h1>
      <p className="mt-1 text-sm text-slate-500">El plan Básico es gratis hasta 3 inmuebles activos. Del cuarto en adelante hay que pagar la suscripción.</p>
      <ErrorBanner message={err} onClose={() => setErr("")} />
      {msg ? <p className="mt-3 text-sm font-semibold text-emerald-600">{msg}</p> : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {PLANES.map(([codigo, nombre, cupo, precio, incluye]) => (
          <article key={codigo} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="text-lg font-bold dark:text-white">{nombre}</div>
            <div className="text-sm text-slate-500">{cupo}</div>
            <div className="mt-1 font-semibold text-amber-600">{precio}</div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{incluye}</p>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="font-bold dark:text-white">Cobros aparte</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
          <li>Destacado en portada, 7 días: $5.</li>
          <li>Re-post, subir el aviso al inicio: $2.</li>
          <li>Publicación extra: $3 al mes por inmueble encima del plan.</li>
          <li>Vacacional opción A: 3 % a 5 % si el portal procesa el pago.</li>
          <li>Vacacional opción B: $1.50 al mes por cada propiedad por noche.</li>
          <li>Pack de fotos y video: $30 a $50 por inmueble.</li>
          <li>Banner lateral: $15 al mes. El clic abre la empresa que anuncia.</li>
        </ul>
      </section>

      <section className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="font-bold dark:text-white">Suscripción del corredor</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Corredor</th>
              <th>Activos</th>
              <th>Plan</th>
              <th>Pagado</th>
              <th>Extra</th>
              <th>Vacacional</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {corredores.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 dark:border-slate-700">
                <td className="py-2">
                  <div className="font-semibold dark:text-white">{row.nombre}</div>
                  <div className="text-xs text-slate-500">{row.email}</div>
                </td>
                <td>{row.activos} / {row.cupo?.limite ?? "∞"}</td>
                <td>
                  <select
                    className="rounded-lg border px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
                    value={row.plan_codigo || "basico"}
                    onChange={(e) => guardar(row, { plan_codigo: e.target.value, plan_pagado: e.target.value !== "basico" })}
                  >
                    {PLANES.map(([codigo, nombre]) => <option key={codigo} value={codigo}>{nombre}</option>)}
                  </select>
                </td>
                <td>
                  <div>{row.plan_pagado && row.plan_vigente_hasta && new Date(row.plan_vigente_hasta) > new Date() ? "Sí" : "No"}</div>
                  <div className="text-xs text-slate-500">{row.plan_vigente_hasta ? new Date(row.plan_vigente_hasta).toLocaleDateString("es-VE") : "sin fecha"}</div>
                </td>
                <td>
                  <input
                    className="w-16 rounded-lg border px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
                    type="number"
                    min="0"
                    defaultValue={row.publicaciones_extra || 0}
                    onBlur={(e) => guardar(row, { publicaciones_extra: Number(e.target.value || 0) })}
                  />
                </td>
                <td>
                  <select
                    className="rounded-lg border px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
                    value={row.opcion_vacacional || "porcentaje"}
                    onChange={(e) => guardar(row, { opcion_vacacional: e.target.value })}
                  >
                    <option value="porcentaje">3 % a 5 %</option>
                    <option value="noche">$1.50 / noche</option>
                  </select>
                  {row.opcion_vacacional !== "noche" ? (
                    <input
                      className="ml-2 w-16 rounded-lg border px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
                      type="number"
                      min="3"
                      max="5"
                      step="1"
                      defaultValue={row.porcentaje_vacacional || 3}
                      onBlur={(e) => guardar(row, { porcentaje_vacacional: Number(e.target.value || 3) })}
                    />
                  ) : (
                    <span className="ml-2 text-xs text-slate-500">{row.vacacionales} × $1.50 / mes</span>
                  )}
                </td>
                <td className="space-x-2">
                  <button type="button" className="text-xs font-bold text-emerald-600" onClick={() => guardar(row, { plan_pagado: true, ciclo: "mensual" })}>1 mes</button>
                  <button type="button" className="text-xs font-bold text-emerald-600" onClick={() => guardar(row, { plan_pagado: true, ciclo: "anual" })}>1 año</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <form className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800" onSubmit={(e) => { e.preventDefault(); boost("/planes/destacar"); }}>
          <h2 className="font-bold dark:text-white">Destacar o re-post</h2>
          <input className="mt-3 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="ID del inmueble" value={inmuebleId} onChange={(e) => setInmuebleId(e.target.value)} />
          <div className="mt-3 flex gap-2">
            <button className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold" type="submit">Destacar 7 días · $5</button>
            <button className="rounded-xl border px-3 py-2 text-sm font-bold dark:border-slate-600" type="button" onClick={() => boost("/planes/repost")}>Re-post · $2</button>
          </div>
        </form>
        <form className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800" onSubmit={publicarAnuncio}>
          <h2 className="font-bold dark:text-white">Anuncio</h2>
          <input className="mt-3 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Título" value={anuncio.titulo} onChange={(e) => setAnuncio({ ...anuncio, titulo: e.target.value })} />
          <input className="mt-2 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Empresa" value={anuncio.empresa} onChange={(e) => setAnuncio({ ...anuncio, empresa: e.target.value })} />
          <input className="mt-2 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="https://empresa.com" value={anuncio.enlace} onChange={(e) => setAnuncio({ ...anuncio, enlace: e.target.value })} />
          <select className="mt-2 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" value={anuncio.posicion} onChange={(e) => setAnuncio({ ...anuncio, posicion: e.target.value })}>
            <option value="carrusel">Carrusel de portada · 1 mes</option>
            <option value="lateral">Banner lateral · $15 / mes</option>
          </select>
          {anuncio.posicion === "lateral" ? (
            <select className="mt-2 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" value={anuncio.corredor_id} onChange={(e) => setAnuncio({ ...anuncio, corredor_id: e.target.value })}>
              <option value="">Corredor a quien se cobra</option>
              {corredores.map((row) => <option key={row.id} value={row.id}>{row.nombre}</option>)}
            </select>
          ) : null}
          <button className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white" type="submit">Publicar anuncio</button>
        </form>
      </section>

      {oficina ? (
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="font-bold dark:text-white">Cobros</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(oficina.cargos || []).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span>{c.corredor} · {c.concepto}{c.inmueble ? ` · ${c.inmueble}` : ""} · ${Number(c.monto).toFixed(2)} · {c.estatus_pago}</span>
                  {c.concepto === "fotos" && c.estatus_pago === "pagado" && !c.detalle?.entregado ? (
                    <form className="flex items-center gap-2" onSubmit={async (e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.archivos;
                      if (!input.files?.length) return;
                      const fd = new FormData();
                      for (const file of input.files) fd.append("archivos", file);
                      await apiUpload(`/planes/cargos/${c.id}/entrega`, fd);
                      setMsg("Fotos publicadas en la ficha del inmueble.");
                      await load();
                    }}>
                      <input name="archivos" type="file" multiple required accept={Number(c.monto) >= 50 ? "image/*,video/mp4,video/webm,video/quicktime" : "image/*"} />
                      <button className="text-xs font-bold text-emerald-600" type="submit">Publicar en la ficha</button>
                    </form>
                  ) : c.concepto === "fotos" && c.detalle?.entregado ? <span className="text-xs text-emerald-600">En la ficha</span> : null}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="font-bold dark:text-white">Soporte Enterprise</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {(oficina.soporte || []).map((s) => (
                <li key={s.id}>
                  <p><strong>{s.corredor}:</strong> {s.mensaje}</p>
                  {s.respuesta ? <p className="text-slate-500">Respuesta: {s.respuesta}</p> : (
                    <form className="mt-1 flex gap-2" onSubmit={async (e) => { e.preventDefault(); await apiPatch(`/planes/soporte/${s.id}`, { respuesta: respuesta[s.id] || "" }); setMsg("Respuesta enviada."); await load(); }}>
                      <input className="flex-1 rounded-lg border px-2 py-1 dark:border-slate-600 dark:bg-slate-900" value={respuesta[s.id] || ""} onChange={(e) => setRespuesta({ ...respuesta, [s.id]: e.target.value })} placeholder="Respuesta" />
                      <button className="text-xs font-bold text-emerald-600" type="submit">Enviar</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="font-bold dark:text-white">Asesores</h2>
            <ul className="mt-3 space-y-1 text-sm">{(oficina.asesores || []).map((a) => <li key={a.id}>{a.nombre} · {a.email} · casa {a.casa || a.casa_id}</li>)}</ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="font-bold dark:text-white">Vehículos</h2>
            <ul className="mt-3 space-y-1 text-sm">{(oficina.vehiculos || []).map((v) => <li key={v.id}>{v.nombre} · ${Number(v.precio_dia).toFixed(2)} / día · {v.corredor}</li>)}</ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
            <h2 className="font-bold dark:text-white">Vistas, leads y reservas</h2>
            <p className="mt-1 text-sm text-slate-500" data-no-i18n>
              {oficina.reporte?.totales?.vistas || 0} vistas · {oficina.reporte?.totales?.leads || 0} leads · {oficina.reporte?.totales?.reservas || 0} reservas
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {(oficina.reporte?.inmuebles || []).map((i) => (
                <li key={i.id} className="flex justify-between gap-3" data-no-i18n>
                  <span>{i.titulo} · {i.corredor}</span>
                  <span>{i.vistas} vistas · {i.leads} leads · {i.reservas} reservas</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
