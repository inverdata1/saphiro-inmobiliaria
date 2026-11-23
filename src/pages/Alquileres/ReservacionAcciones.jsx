import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost, apiPut } from "../../api";
import { PagoMovilQr, textoPagoMovil } from "../../components/pagos/PagoMovilQr";

export default function ReservacionAcciones({ reserva, user, isAdmin, onChange }) {
  const [motivo, setMotivo] = useState("");
  const [pago, setPago] = useState(null);
  const [formPago, setFormPago] = useState({ banco: "", telefono: "", cedula: "", titular: "" });
  const [estrellas, setEstrellas] = useState(5);
  const [comentarioInmueble, setComentarioInmueble] = useState("");
  const [comentarioCorredor, setComentarioCorredor] = useState("");
  const [error, setError] = useState("");
  const id = reserva.reserva_id || reserva.id;
  const esCliente = Number(user?.id) === Number(reserva.cliente_id);
  const puedeGestionar = isAdmin || Number(user?.id) === Number(reserva.corredor_usuario_id);

  useEffect(() => {
    apiGet("/citas/pago-movil")
      .then((res) => {
        const data = res?.data || {};
        setPago(data);
        setFormPago({
          banco: data.banco || "",
          telefono: data.telefono || "",
          cedula: data.cedula || "",
          titular: data.titular || "",
        });
      })
      .catch(() => {});
  }, []);

  const correr = async (path, body) => {
    setError("");
    try {
      const res = await apiPost(path, body || {});
      onChange(res?.data || reserva);
    } catch (err) {
      setError(err.message || "No se pudo completar");
    }
  };

  const texto = textoPagoMovil(pago);
  const abierta = reserva.estatus_pago !== "cancelado" && reserva.estatus_pago !== "pagado";

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {reserva.apartado_hasta && !reserva.autorizada && abierta ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          El sistema aparta esta reserva por 24 horas, hasta {String(reserva.apartado_hasta).slice(0, 16).replace("T", " ")}. Si no se autoriza, se libera.
        </p>
      ) : null}
      {reserva.motivo_cancelacion ? (
        <p className="text-xs text-slate-500">Motivo de la cancelación: {reserva.motivo_cancelacion}</p>
      ) : null}
      {esCliente && reserva.autorizada && abierta ? (
        <Link to={`/pagar-reserva/${id}`} className="block rounded-2xl bg-emerald-700 px-4 py-3 text-center text-sm font-black text-white">
          Pagar hospedaje
        </Link>
      ) : null}
      <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
        <p className="text-xs font-bold uppercase text-slate-400">Datos bancarios y QR de pago móvil</p>
        {texto ? (
          <div className="mt-2 flex items-start gap-3">
            <PagoMovilQr texto={texto} size={140} />
            <pre className="whitespace-pre-wrap text-xs">{texto}{pago?.titular ? `\nTitular: ${pago.titular}` : ""}</pre>
          </div>
        ) : (
          <p className="mt-1 text-xs text-slate-500">Todavía no hay datos de pago móvil.</p>
        )}
        {isAdmin ? (
          <form
            className="mt-3 grid gap-2 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              try {
                const res = await apiPut("/citas/pago-movil", formPago);
                setPago(res?.data || formPago);
              } catch (err) {
                setError(err.message || "No se guardaron los datos");
              }
            }}
          >
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Banco" value={formPago.banco} onChange={(e) => setFormPago({ ...formPago, banco: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Teléfono" value={formPago.telefono} onChange={(e) => setFormPago({ ...formPago, telefono: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Cédula" value={formPago.cedula} onChange={(e) => setFormPago({ ...formPago, cedula: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Titular" value={formPago.titular} onChange={(e) => setFormPago({ ...formPago, titular: e.target.value })} />
            <button type="submit" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white sm:col-span-2">Guardar pago móvil</button>
          </form>
        ) : null}
      </div>
      {abierta && (esCliente || puedeGestionar) ? (
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            correr(`/reservas/${id}/cancelar`, { motivo });
          }}
        >
          <input className="rounded-xl border px-3 py-2 text-sm" placeholder="¿Por qué se cancela?" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <button type="submit" className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-bold text-rose-700">Cancelar reserva</button>
        </form>
      ) : null}
      {puedeGestionar && abierta && !reserva.autorizada ? (
        <button type="button" className="rounded-xl border px-3 py-2 text-sm font-bold" onClick={() => correr(`/reservas/${id}/prolongar`, {})}>
          Prolongar 24 horas
        </button>
      ) : null}
      {esCliente && reserva.estado_estancia === "finalizada" && !reserva.calificacion ? (
        <form
          className="grid gap-2 rounded-2xl border border-slate-200 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            correr(`/reservas/${id}/calificar`, {
              estrellas,
              comentario_inmueble: comentarioInmueble,
              comentario_corredor: comentarioCorredor,
            });
          }}
        >
          <p className="text-xs font-bold uppercase text-slate-400">Calificar la estadía</p>
          <textarea className="rounded-xl border px-3 py-2 text-sm" placeholder="Comentario del inmueble" value={comentarioInmueble} onChange={(e) => setComentarioInmueble(e.target.value)} />
          <label className="text-sm">Estrellas del corredor
            <input type="number" min="1" max="5" className="mt-1 w-full rounded-xl border px-3 py-2" value={estrellas} onChange={(e) => setEstrellas(Number(e.target.value))} />
          </label>
          <textarea className="rounded-xl border px-3 py-2 text-sm" placeholder="Comentario del corredor" value={comentarioCorredor} onChange={(e) => setComentarioCorredor(e.target.value)} />
          <button type="submit" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white">Enviar calificación</button>
          <p className="text-xs text-slate-500">Si las estrellas son 1 o 2, la administradora recibe el aviso de calificación negativa.</p>
        </form>
      ) : null}
      {reserva.calificacion ? (
        <p className="text-xs text-slate-500">
          Calificación enviada: {reserva.calificacion.estrellas_corredor} estrellas al corredor.
          {Number(reserva.calificacion.estrellas_corredor) <= 2 ? " Quedó marcada como negativa para la administradora." : ""}
        </p>
      ) : null}
    </div>
  );
}
