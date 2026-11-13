import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";
import PasarelaPago from "../components/pagos/PasarelaPago";
import ErrorBanner from "../components/error/ErrorBanner";

export default function MiPlanPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [cargo, setCargo] = useState(null);
  const [asesor, setAsesor] = useState({ nombre: "", email: "", password: "" });
  const [vehiculo, setVehiculo] = useState({ nombre: "", precio_dia: "" });
  const [inmuebleId, setInmuebleId] = useState("");
  const [banner, setBanner] = useState({ titulo: "", empresa: "", enlace: "" });
  const [mensaje, setMensaje] = useState("");

  async function load() {
    const r = await apiGet("/planes/mio");
    setData(r.data);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  async function preparar(body) {
    setErr("");
    setMsg("");
    const r = await apiPost("/planes/cargos", body);
    if (r.data?.estatus_pago === "pagado") {
      setMsg(r.data.concepto === "destacado_incluido" ? "Destacado incluido en el plan, por 7 días." : "Listo.");
      setCargo(null);
      await load();
      return;
    }
    setCargo(r.data);
  }

  async function pagar(pago) {
    const r = await apiPost(`/planes/cargos/${cargo.id}/pagar`, {});
    setMsg("Pago registrado.");
    setCargo(null);
    await load();
    const digitos = String(pago?.formData?.numeroTarjeta || "").replace(/\D/g, "");
    return {
      numAprobacion: `PLAN-${String(r.data.id).padStart(6, "0")}`,
      referencia: String(r.data.id),
      metodo: pago?.metodoPago || "tarjeta",
      brand: pago?.cardBrand,
      ultimosDigitos: digitos ? digitos.slice(-4) : undefined,
      montoPrincipal: Number(r.data.monto),
      moneda: "USD",
    };
  }

  if (!data) {
    return <div className="mx-auto max-w-5xl px-4 py-8"><ErrorBanner message={err} onClose={() => setErr("")} /></div>;
  }

  const cupo = data.cupo || {};
  const hasta = data.casa?.plan_vigente_hasta ? new Date(data.casa.plan_vigente_hasta).toLocaleDateString("es-VE") : "sin suscripción";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-extrabold dark:text-white">Mi plan</h1>
      <p className="mt-1 text-sm text-slate-500" data-no-i18n>
        {cupo.plan} · vigente hasta {hasta} · {data.casa ? `${cupo.limite == null ? "ilimitados" : cupo.limite} inmuebles` : ""} · destacados este mes {data.destacados_usados}/{cupo.destacados}
        {cupo.verificada ? " · Inmobiliaria verificada" : ""}
      </p>
      <ErrorBanner message={err} onClose={() => setErr("")} />
      {msg ? <p className="mt-3 text-sm font-semibold text-emerald-600">{msg}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          ["pro", "Corredor Pro", "15 / mes", "144 / año"],
          ["pyme", "Inmobiliaria Pyme", "35 / mes", "336 / año"],
          ["enterprise", "Enterprise", "75 / mes", "720 / año"],
        ].map(([codigo, nombre, mes, ano]) => (
          <article key={codigo} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="font-bold dark:text-white">{nombre}</div>
            <div className="mt-2 flex gap-2">
              <button type="button" className="rounded-lg bg-amber-500 px-2 py-1 text-xs font-bold" onClick={() => preparar({ concepto: "plan", plan_codigo: codigo, ciclo: "mensual" }).catch((e) => setErr(e.message))}>Pagar ${mes}</button>
              <button type="button" className="rounded-lg border px-2 py-1 text-xs font-bold dark:border-slate-600" onClick={() => preparar({ concepto: "plan", plan_codigo: codigo, ciclo: "anual" }).catch((e) => setErr(e.message))}>Pagar ${ano}</button>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="font-bold dark:text-white">Cobros del aviso</h2>
        <input className="mt-3 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="ID del inmueble" value={inmuebleId} onChange={(e) => setInmuebleId(e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold" onClick={() => preparar({ concepto: "destacado", inmueble_id: Number(inmuebleId) }).catch((e) => setErr(e.message))}>Destacar 7 días · $5</button>
          <button type="button" className="rounded-lg border px-3 py-2 text-xs font-bold dark:border-slate-600" onClick={() => preparar({ concepto: "repost", inmueble_id: Number(inmuebleId) }).catch((e) => setErr(e.message))}>Re-post · $2</button>
          <button type="button" className="rounded-lg border px-3 py-2 text-xs font-bold dark:border-slate-600" onClick={() => preparar({ concepto: "extra" }).catch((e) => setErr(e.message))}>Publicación extra · $3 / mes</button>
          <button type="button" className="rounded-lg border px-3 py-2 text-xs font-bold dark:border-slate-600" onClick={() => preparar({ concepto: "fotos", inmueble_id: Number(inmuebleId), monto: 30 }).catch((e) => setErr(e.message))}>Fotos · $30</button>
          <button type="button" className="rounded-lg border px-3 py-2 text-xs font-bold dark:border-slate-600" onClick={() => preparar({ concepto: "fotos", inmueble_id: Number(inmuebleId), monto: 50 }).catch((e) => setErr(e.message))}>Fotos y video · $50</button>
          <button type="button" className="rounded-lg border px-3 py-2 text-xs font-bold dark:border-slate-600" onClick={() => preparar({ concepto: "canon" }).catch((e) => setErr(e.message))}>Canon vacacional · ${Number(data.canon || 0).toFixed(2)}</button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <input className="rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Título del banner" value={banner.titulo} onChange={(e) => setBanner({ ...banner, titulo: e.target.value })} />
          <input className="rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Empresa" value={banner.empresa} onChange={(e) => setBanner({ ...banner, empresa: e.target.value })} />
          <input className="rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="https://empresa.com" value={banner.enlace} onChange={(e) => setBanner({ ...banner, enlace: e.target.value })} />
        </div>
        <button type="button" className="mt-2 rounded-lg border px-3 py-2 text-xs font-bold dark:border-slate-600" onClick={() => preparar({ concepto: "banner", ...banner }).catch((e) => setErr(e.message))}>Banner lateral · $15 / mes</button>
      </section>

      {cargo && cargo.estatus_pago !== "pagado" ? (
        <div className="mt-6">
          <PasarelaPago
            titulo="Pago del portal"
            subtitulo={cargo.concepto}
            montoLabel={`$${Number(cargo.monto).toFixed(2)} USD`}
            inmueble={{ titulo: `Portal · ${cargo.concepto}` }}
            onSubmit={pagar}
            onComprobanteClose={() => setCargo(null)}
          />
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <form className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-800" onSubmit={(e) => { e.preventDefault(); apiPost("/planes/asesores", asesor).then(() => { setMsg("Asesor creado."); setAsesor({ nombre: "", email: "", password: "" }); load(); }).catch((er) => setErr(er.message)); }}>
          <h2 className="font-bold dark:text-white">Asesores</h2>
          <p className="text-xs text-slate-500">Pyme incluye 3. Enterprise, ilimitados.</p>
          {(data.asesores || []).map((a) => <div key={a.id} className="mt-2 text-sm dark:text-slate-200">{a.nombre} · {a.email}</div>)}
          <input className="mt-3 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Nombre" value={asesor.nombre} onChange={(e) => setAsesor({ ...asesor, nombre: e.target.value })} />
          <input className="mt-2 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Correo" value={asesor.email} onChange={(e) => setAsesor({ ...asesor, email: e.target.value })} />
          <input className="mt-2 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Clave de 8 caracteres" type="password" value={asesor.password} onChange={(e) => setAsesor({ ...asesor, password: e.target.value })} />
          <button className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white" type="submit">Crear subcuenta</button>
        </form>
        <form className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-800" onSubmit={(e) => { e.preventDefault(); apiPost("/planes/vehiculos", vehiculo).then(() => { setMsg("Vehículo publicado."); setVehiculo({ nombre: "", precio_dia: "" }); load(); }).catch((er) => setErr(er.message)); }}>
          <h2 className="font-bold dark:text-white">Vehículos para la reserva</h2>
          {(data.vehiculos || []).map((v) => <div key={v.id} className="mt-2 text-sm dark:text-slate-200">{v.nombre} · ${v.precio_dia} / día</div>)}
          <input className="mt-3 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Nombre" value={vehiculo.nombre} onChange={(e) => setVehiculo({ ...vehiculo, nombre: e.target.value })} />
          <input className="mt-2 w-full rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Precio por día" value={vehiculo.precio_dia} onChange={(e) => setVehiculo({ ...vehiculo, precio_dia: e.target.value })} />
          <button className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white" type="submit">Agregar vehículo</button>
        </form>
      </section>

      {data.reporte ? (
        <section className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="font-bold dark:text-white">{cupo.plan === "enterprise" ? "Reporte de rendimiento" : "Estadísticas de vistas y leads"}</h2>
          <p className="text-sm text-slate-500" data-no-i18n>
            {data.reporte.totales.vistas} vistas · {data.reporte.totales.leads} leads · {data.reporte.totales.reservas} reservas
          </p>
          <div className="mt-3 space-y-1 text-sm">
            {data.reporte.inmuebles.map((i) => (
              <div key={i.id} className="flex justify-between gap-3 dark:text-slate-200" data-no-i18n>
                <span>{i.titulo}</span>
                <span>{i.vistas} vistas · {i.leads} leads · {i.reservas} reservas</span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="mt-6 text-sm text-slate-500">Las estadísticas de vistas y leads entran con Corredor Pro.</p>
      )}

      {cupo.plan === "enterprise" ? (
        <section className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="font-bold dark:text-white">Soporte prioritario</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data.soporte || []).map((s) => (
              <li key={s.id} data-no-i18n>
                <p>{s.mensaje}</p>
                <p className="text-slate-500">{s.respuesta ? `Respuesta: ${s.respuesta}` : "Sin respuesta todavía"}</p>
              </li>
            ))}
          </ul>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); apiPost("/planes/soporte", { mensaje }).then(() => { setMensaje(""); setMsg("Mensaje enviado."); load(); }).catch((er) => setErr(er.message)); }}>
            <input className="flex-1 rounded-xl border px-3 py-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Escribe a soporte" value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
            <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white" type="submit">Enviar</button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
