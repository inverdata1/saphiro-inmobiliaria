import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet, apiPost } from "../../api";
import { useAuth } from "../../context/useAuth";

const ESTADO = {
  solicitada: "Por aceptar",
  aceptada: "Aceptada, falta el horario",
  programada: "Horario propuesto",
  confirmada: "Confirmada",
  rechazada: "No agendada",
};

export default function CitasPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const foco = params.get("cita");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [horario, setHorario] = useState({ fecha: "", hora: "" });

  const cargar = () => {
    apiGet("/citas")
      .then((res) => setRows(Array.isArray(res?.data) ? res.data : []))
      .catch((err) => setError(err.message || "No se pudieron cargar las citas"));
  };

  useEffect(() => {
    cargar();
  }, []);

  const actuar = async (id, accion, body) => {
    setError("");
    try {
      await apiPost(`/citas/${id}/${accion}`, body || {});
      cargar();
    } catch (err) {
      setError(err.message || "No se pudo actualizar la cita");
    }
  };

  const esAdmin = user?.rol === "admin" || user?.rol === "corredor";

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">Citas para ver un inmueble</h1>
      <p className="text-sm text-slate-500">La administradora acepta, el cliente elige día y hora, y la administradora confirma.</p>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {rows.map((cita) => {
        const activa = String(foco) === String(cita.id);
        const hora = cita.hora ? String(cita.hora).slice(0, 5) : "";
        const fecha = cita.fecha ? String(cita.fecha).slice(0, 10) : "";
        return (
          <article key={cita.id} className={`rounded-2xl border p-4 ${activa ? "border-emerald-500" : "border-slate-200 dark:border-slate-700"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black text-slate-900 dark:text-slate-50">{cita.inmueble_titulo}</h2>
                <p className="text-sm text-slate-500">{cita.cliente_nombre} · {ESTADO[cita.estado] || cita.estado}</p>
                {fecha ? <p className="text-sm font-semibold">{fecha} a las {hora}</p> : null}
              </div>
            </div>
            {esAdmin && cita.estado === "solicitada" ? (
              <div className="mt-3 flex gap-2">
                <button type="button" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white" onClick={() => actuar(cita.id, "aceptar")}>Aceptar</button>
                <button type="button" className="rounded-xl border px-3 py-2 text-sm font-bold" onClick={() => actuar(cita.id, "rechazar")}>No agendar</button>
              </div>
            ) : null}
            {Number(user?.id) === Number(cita.cliente_id) && (cita.estado === "aceptada" || cita.estado === "programada") ? (
              <form
                className="mt-3 grid max-w-sm gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-700"
                onSubmit={(e) => {
                  e.preventDefault();
                  actuar(cita.id, "programar", horario);
                }}
              >
                <p className="text-xs font-bold text-slate-500">Elige el día y la hora</p>
                <input type="date" required className="rounded-xl border px-3 py-2 text-sm" value={horario.fecha} onChange={(e) => setHorario({ ...horario, fecha: e.target.value })} />
                <input type="time" required className="rounded-xl border px-3 py-2 text-sm" value={horario.hora} onChange={(e) => setHorario({ ...horario, hora: e.target.value })} />
                <button type="button" className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white" onClick={() => actuar(cita.id, "programar", horario)}>Enviar horario</button>
              </form>
            ) : null}
            {esAdmin && cita.estado === "programada" ? (
              <button type="button" className="mt-3 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white" onClick={() => actuar(cita.id, "confirmar")}>Confirmar cita</button>
            ) : null}
          </article>
        );
      })}
      {!rows.length ? <p className="text-sm text-slate-500">No hay citas.</p> : null}
    </div>
  );
}
