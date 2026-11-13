import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiGet, apiPost } from "../api";
import { useAuth } from "../context/useAuth";
import PasarelaPago from "../components/pagos/PasarelaPago";

const PREGUNTAS = [
  ["¿El plan Básico tiene costo?", "No. Publicas hasta 3 inmuebles activos con perfil público y leads por WhatsApp. Del cuarto en adelante hay que suscribir un plan."],
  ["¿El anual descuenta el 20 %?", "Sí. El precio anual de cada plan es el mensual multiplicado por 12 y descontado 20 %."],
  ["¿Puedo publicar más inmuebles que el cupo?", "Sí. Cada publicación extra cuesta 3 USD al mes, encima del plan."],
  ["¿El destacado está incluido?", "Corredor Pro incluye 1 al mes, Pyme 3 y Enterprise 10. Si se acaba el cupo, el destacado extra cuesta 5 USD por 7 días."],
];

export default function PreciosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [catalogo, setCatalogo] = useState(null);
  const [anual, setAnual] = useState(false);
  const [planCodigo, setPlanCodigo] = useState("pro");
  const [extras, setExtras] = useState(0);
  const [abierta, setAbierta] = useState(0);
  const [pagarAhora, setPagarAhora] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    apiGet("/planes/catalogo").then((r) => setCatalogo(r.data)).catch(() => setCatalogo(null));
  }, []);

  useEffect(() => {
    const plan = params.get("plan");
    if (!plan) return;
    setPlanCodigo(plan);
    setAnual(params.get("ciclo") === "anual");
    const extra = Number(params.get("extras") || 0);
    if (extra) setExtras(extra);
    setPagarAhora(true);
  }, [params]);

  const planes = catalogo?.planes || [];
  const extraPrecio = Number(catalogo?.boosts?.find((b) => b.codigo === "extra")?.precio || 3);
  const elegido = planes.find((p) => p.codigo === planCodigo) || planes[1] || planes[0];

  const total = useMemo(() => {
    if (!elegido) return 0;
    const base = anual ? Number(elegido.precio_anual) / 12 : Number(elegido.precio_mensual);
    return base + extras * extraPrecio;
  }, [elegido, anual, extras, extraPrecio]);

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <section className="bg-[#5a0e82] text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Planes para corredores</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Publica más inmuebles y atiende tus leads desde un solo lugar</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80">
            Elige el cupo que necesitas. El pago anual ya incluye 20 % de descuento. Los precios son los que cobra la plataforma hoy.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a href="#planes" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#5a0e82]">Ver planes</a>
            <Link to="/corredores/registro" className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-bold">Registrarme</Link>
            <Link to="/crm" className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-bold">CRM del corredor</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-5xl justify-center px-4 py-8">
        <div className="inline-flex rounded-full bg-white p-1 shadow-sm dark:bg-slate-800">
          <button type="button" onClick={() => setAnual(false)} className={`rounded-full px-4 py-2 text-sm font-bold ${!anual ? "bg-[#5a0e82] text-white" : "text-slate-600"}`}>Mensual</button>
          <button type="button" onClick={() => setAnual(true)} className={`rounded-full px-4 py-2 text-sm font-bold ${anual ? "bg-[#5a0e82] text-white" : "text-slate-600"}`}>Anual · −20 %</button>
        </div>
      </div>

      <section id="planes" className="mx-auto grid max-w-5xl gap-4 px-4 pb-10 md:grid-cols-2 xl:grid-cols-4">
        {planes.map((plan) => {
          const mes = anual ? Number(plan.precio_anual) / 12 : Number(plan.precio_mensual);
          return (
            <article key={plan.codigo} className={`rounded-2xl border bg-white p-5 dark:bg-slate-900 ${plan.codigo === "pro" ? "border-[#5a0e82] ring-2 ring-[#5a0e82]" : "border-slate-200 dark:border-slate-700"}`}>
              {plan.codigo === "pro" ? <div className="mb-2 text-xs font-bold uppercase text-[#5a0e82]">Más usado</div> : null}
              <h2 className="text-lg font-extrabold dark:text-white">{plan.nombre}</h2>
              <div className="mt-2 text-3xl font-extrabold dark:text-white">{mes === 0 ? "Gratis" : `$${mes.toFixed(0)}`}<span className="text-sm font-medium text-slate-500">{mes === 0 ? "" : " / mes"}</span></div>
              {anual && mes > 0 ? <p className="text-xs text-slate-500"><span data-no-i18n>${plan.precio_anual}</span> al año</p> : null}
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{plan.activos == null ? "Inmuebles ilimitados" : `Hasta ${plan.activos} activos`}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{plan.incluye}</p>
              {plan.precio_mensual === 0 ? (
                <Link to="/corredores/registro" className="mt-4 block rounded-xl bg-[#5a0e82] py-2 text-center text-sm font-bold text-white">Empezar gratis</Link>
              ) : (
                <button type="button" onClick={() => { setPlanCodigo(plan.codigo); setPagarAhora(true); setTimeout(() => document.getElementById("pago")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); }} className="mt-4 block w-full rounded-xl bg-[#5a0e82] py-2 text-center text-sm font-bold text-white">Suscribirme</button>
              )}
            </article>
          );
        })}
      </section>

      <section id="calculadora" className="mx-auto max-w-3xl px-4 pb-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-extrabold dark:text-white">Calculadora</h2>
          <p className="mt-1 text-sm text-slate-500">Suma el plan y las publicaciones extra. Cada una cuesta <span data-no-i18n>{extraPrecio} USD</span> al mes.</p>
          <label className="mt-4 block text-sm font-semibold dark:text-slate-200">Plan
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800" value={planCodigo} onChange={(e) => setPlanCodigo(e.target.value)}>
              {planes.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
            </select>
          </label>
          <label className="mt-3 block text-sm font-semibold dark:text-slate-200">Publicaciones extra
            <input type="number" min="0" max="200" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800" value={extras} onChange={(e) => setExtras(Math.max(0, Number(e.target.value) || 0))} />
          </label>
          <p className="mt-4 text-2xl font-extrabold text-[#5a0e82]"><span data-no-i18n>${total.toFixed(2)}</span> <span className="text-sm font-medium text-slate-500">al mes</span></p>
        </div>
      </section>

      {pagarAhora && elegido && Number(elegido.precio_mensual) > 0 ? (
        <section id="pago" className="mx-auto max-w-3xl px-4 pb-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-xl font-extrabold dark:text-white">Plan seleccionado</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{elegido.nombre} · {anual ? "Anual" : "Mensual"} · {elegido.activos == null ? "Inmuebles ilimitados" : `Hasta ${elegido.activos} activos`}</p>
            <p className="mt-2 text-sm text-slate-500">La calculadora de arriba suma el plan y las publicaciones extra. El pago de abajo cobra ese total.</p>
            <p className="mt-3 text-2xl font-extrabold text-[#5a0e82]" data-no-i18n>${(anual ? Number(elegido.precio_anual) + extras * extraPrecio * 12 : total).toFixed(2)} USD</p>
            {msg ? <p className="mt-2 text-sm font-semibold text-emerald-600">{msg}</p> : null}
            <div className="mt-4">
                <PasarelaPago
                  titulo="Pago del plan"
                  subtitulo={elegido.nombre}
                  montoLabel={`$${(anual ? Number(elegido.precio_anual) + extras * extraPrecio * 12 : total).toFixed(2)} USD`}
                  inmueble={{ titulo: elegido.nombre }}
                  onSubmit={async (pago) => {
                    if (user?.rol !== "corredor" && user?.rol !== "admin") {
                      navigate("/login", { state: { from: `/precios?plan=${elegido.codigo}&ciclo=${anual ? "anual" : "mensual"}&extras=${extras}` } });
                      throw new Error("Inicia sesión como corredor para pagar el plan");
                    }
                    const ciclo = anual ? "anual" : "mensual";
                    const creado = await apiPost("/planes/cargos", { concepto: "plan", plan_codigo: elegido.codigo, ciclo });
                    const cargo = creado.data;
                    if (cargo?.id && cargo.estatus_pago !== "pagado") await apiPost(`/planes/cargos/${cargo.id}/pagar`, {});
                    for (let i = 0; i < extras; i += 1) {
                      const extra = await apiPost("/planes/cargos", { concepto: "extra" });
                      if (extra.data?.id && extra.data.estatus_pago !== "pagado") await apiPost(`/planes/cargos/${extra.data.id}/pagar`, {});
                    }
                    setMsg("Pago del plan registrado.");
                    return {
                      numAprobacion: `PLAN-${String(cargo?.id || "").padStart(6, "0")}`,
                      referencia: String(cargo?.id || ""),
                      metodo: pago?.metodoPago || "tarjeta",
                      montoPrincipal: anual ? Number(elegido.precio_anual) + extras * extraPrecio * 12 : total,
                      moneda: "USD",
                    };
                  }}
                />
              </div>
          </div>
        </section>
      ) : null}

      <section id="preguntas" className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="text-xl font-extrabold dark:text-white">Preguntas frecuentes</h2>
        <div className="mt-3 space-y-2">
          {PREGUNTAS.map(([q, a], i) => (
            <button key={q} type="button" onClick={() => setAbierta(abierta === i ? -1 : i)} className="block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left dark:border-slate-700 dark:bg-slate-900">
              <div className="font-bold dark:text-white">{q}</div>
              {abierta === i ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{a}</p> : null}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
