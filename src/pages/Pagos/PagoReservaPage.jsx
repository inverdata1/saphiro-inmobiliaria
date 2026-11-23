import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PasarelaPago from "../../components/pagos/PasarelaPago";
import { PagoMovilQr, textoPagoMovil } from "../../components/pagos/PagoMovilQr";
import { apiGet, apiPost } from "../../api";
import { useAuth } from "../../context/useAuth";

export default function PagoReservaPage() {
  const { reservaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reserva, setReserva] = useState(null);
  const [pagoMovil, setPagoMovil] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet(`/reservas/${reservaId}`)
      .then((res) => setReserva(res?.data || null))
      .catch((err) => setError(err.message || "No se pudo abrir la reserva"));
    apiGet("/citas/pago-movil")
      .then((res) => setPagoMovil(res?.data || null))
      .catch(() => setPagoMovil(null));
  }, [reservaId]);

  if (error) return <p className="p-8 text-sm text-rose-600">{error}</p>;
  if (!reserva) return <p className="p-8 text-sm">Cargando el pago…</p>;

  const total = Number(reserva.precio_total || 0);
  const porcentaje = Number(reserva.porcentaje_reserva ?? 50);
  const cobrar = Math.round(total * porcentaje) / 100;
  const moneda = reserva.moneda || "USD";
  const texto = textoPagoMovil(pagoMovil);
  const puedePagar = reserva.autorizada && reserva.estatus_pago !== "pagado" && reserva.estatus_pago !== "cancelado";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <button type="button" className="text-sm font-bold" onClick={() => navigate(-1)}>Volver</button>
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside className="rounded-3xl border border-slate-200 p-4 dark:border-slate-700">
          <h1 className="text-lg font-black">Pagar hospedaje</h1>
          <p className="mt-2 text-sm text-slate-500">{reserva.inmueble_titulo}</p>
          <p className="mt-3 text-sm">Total de la reserva: {total.toFixed(2)} {moneda}</p>
          <p className="text-sm font-black">A pagar ahora ({porcentaje}%): {cobrar.toFixed(2)} {moneda}</p>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase text-slate-400">Datos de pago móvil</p>
            {texto ? (
              <>
                <pre className="mt-2 whitespace-pre-wrap text-sm">{texto}{pagoMovil?.titular ? `\nTitular: ${pagoMovil.titular}` : ""}</pre>
                <PagoMovilQr texto={`${texto}${pagoMovil?.titular ? `\nTitular: ${pagoMovil.titular}` : ""}\nMonto: ${cobrar.toFixed(2)} ${moneda}`} />
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">La administradora todavía no cargó el banco, el teléfono y la cédula del pago móvil.</p>
            )}
          </div>
        </aside>
        {puedePagar ? (
          <PasarelaPago
            titulo="Pagar la reserva vacacional"
            subtitulo="El mismo proceso de la venta: tarjeta, pago móvil, Zelle, Binance o PayPal."
            montoLabel={`${cobrar.toFixed(2)} ${moneda}`}
            inmueble={{ titulo: reserva.inmueble_titulo, precio: cobrar, moneda }}
            onSubmit={async () => {
              if (!user?.id) throw new Error("Debes iniciar sesión");
              const res = await apiPost(`/reservas/${reserva.reserva_id}/pagar`, { modo: "porcentaje" });
              return {
                numAprobacion: `RES-${reserva.reserva_id}`,
                referencia: String(reserva.transaccion_id || reserva.reserva_id),
                metodo: "reserva",
                montoPrincipal: cobrar,
                moneda,
                montoBs: cobrar,
                data: res?.data,
              };
            }}
            onComprobanteClose={() => navigate("/reservaciones")}
          />
        ) : (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
            {reserva.estatus_pago === "pagado"
              ? "Esta reserva ya está pagada."
              : reserva.estatus_pago === "cancelado"
                ? "Esta reserva está cancelada."
                : "La inmobiliaria todavía no autoriza el pago."}
          </p>
        )}
      </div>
    </div>
  );
}
