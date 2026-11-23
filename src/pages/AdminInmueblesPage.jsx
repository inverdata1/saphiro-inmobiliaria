import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiDelete, apiGet } from "../api";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import EditarInmuebleModal from "../components/EditarInmuebleModal";
import { useAuth } from "../context/useAuth";

const AVISO = {
  venta: "Venta",
  alquiler_fijo: "Alquiler",
  vacacional: "Vacacional",
};

function money(row) {
  const n = Number(row.precio);
  if (!Number.isFinite(n)) return "—";
  const formatted = n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${row.moneda || "USD"} ${formatted}`;
}

export default function AdminInmueblesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [editCaracteristicas, setEditCaracteristicas] = useState([]);
  const [fotosTarget, setFotosTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [vista, setVista] = useState("activas");

  const load = useCallback(async (search) => {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const res = await apiGet(`/inmuebles/gestion?${params}`);
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setErr(e.message || "No se pudo cargar el catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  async function abrirEditar(row) {
    setErr("");
    setBusy(true);
    try {
      const [inm, car] = await Promise.all([
        apiGet(`/inmuebles/${row.id}`),
        apiGet(`/caracteristicas/inmueble/${row.id}`),
      ]);
      setEditCaracteristicas(Array.isArray(car?.data) ? car.data : []);
      setEditTarget(inm?.data || null);
    } catch (e) {
      setErr(e.message || "No se pudo abrir el anuncio");
    } finally {
      setBusy(false);
    }
  }

  async function abrirFotos(row) {
    setErr("");
    setBusy(true);
    try {
      const inm = await apiGet(`/inmuebles/${row.id}`);
      setFotosTarget(inm?.data || null);
    } catch (e) {
      setErr(e.message || "No se pudieron leer las fotos");
    } finally {
      setBusy(false);
    }
  }

  async function quitarFoto(img) {
    if (!fotosTarget) return;
    setBusy(true);
    setErr("");
    try {
      await apiDelete(`/imagenes/${img.id}`);
      const inm = await apiGet(`/inmuebles/${fotosTarget.id}`);
      setFotosTarget(inm?.data || null);
      await load(q);
    } catch (e) {
      setErr(e.message || "No se pudo borrar la foto");
    } finally {
      setBusy(false);
    }
  }

  async function quitarTodas() {
    if (!fotosTarget) return;
    setBusy(true);
    setErr("");
    try {
      await apiDelete(`/inmuebles/${fotosTarget.id}/imagenes`, { todas: true });
      const inm = await apiGet(`/inmuebles/${fotosTarget.id}`);
      setFotosTarget(inm?.data || null);
      await load(q);
    } catch (e) {
      setErr(e.message || "No se pudieron borrar las fotos");
    } finally {
      setBusy(false);
    }
  }

  async function eliminarPropiedad() {
    if (!deleteTarget) return;
    setBusy(true);
    setErr("");
    try {
      await apiDelete(`/inmuebles/${deleteTarget.id}`);
      setDeleteTarget(null);
      await load(q);
    } catch (e) {
      setErr(e.message || "No se pudo eliminar la propiedad");
    } finally {
      setBusy(false);
    }
  }

  const columns = [
    {
      key: "titulo",
      header: "Propiedad",
      className: "text-left",
      render: (r) => (
        <div className="text-left">
          <div className="font-semibold text-slate-900 dark:text-slate-100">{r.titulo}</div>
          <div className="text-xs text-slate-500">{[r.ciudad, r.corredor_nombre].filter(Boolean).join(" · ")}</div>
        </div>
      ),
    },
    {
      key: "aviso",
      header: "Aviso",
      render: (r) => AVISO[r.estado_inmueble] || r.estado_inmueble,
    },
    { key: "precio", header: "Precio", render: money },
    {
      key: "fotos",
      header: "Fotos",
      render: (r) => Number(r.fotos || 0),
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (r) => (
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className="text-sm font-semibold text-blue-700 dark:text-blue-300" onClick={() => abrirEditar(r)} disabled={busy}>
            Editar aviso
          </button>
          <button type="button" className="text-sm font-semibold text-slate-700 dark:text-slate-200" onClick={() => abrirFotos(r)} disabled={busy}>
            Fotos
          </button>
          <Link className="text-sm font-semibold text-slate-500" to={`/inmuebles/${r.id}`}>
            Ver
          </Link>
          <button type="button" className="text-sm font-semibold text-red-600" onClick={() => setDeleteTarget(r)} disabled={busy}>
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  const fotos = Array.isArray(fotosTarget?.imagenes) ? fotosTarget.imagenes : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Administrar inmuebles</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          El aviso, las fotos y la ficha se cambian por separado. Si solo quitas fotos, los datos y las características se quedan. Si editas el aviso, las fotos que no borres se quedan.
        </p>
      </div>

      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por título, ciudad o corredor"
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
          Buscar
        </button>
      </form>

      {err ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{err}</p> : null}
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setVista("activas")} className={`rounded-full px-4 py-1.5 text-sm font-bold ${vista === "activas" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "border border-slate-300 dark:border-slate-600"}`}>En publicación</button>
        <button type="button" onClick={() => setVista("vendidas")} className={`rounded-full px-4 py-1.5 text-sm font-bold ${vista === "vendidas" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "border border-slate-300 dark:border-slate-600"}`}>Propiedades vendidas</button>
      </div>
      {loading ? <p className="text-sm text-slate-500">Cargando propiedades…</p> : <DataTable columns={columns} rows={vista === "vendidas" ? rows.filter((r) => r.estatus === "vendido" || r.estatus === "alquilado") : rows.filter((r) => r.estatus !== "vendido" && r.estatus !== "alquilado")} />}

      <EditarInmuebleModal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        inmueble={editTarget}
        caracteristicasIniciales={editCaracteristicas}
        usuarioId={user?.id}
        onSaved={async () => {
          setEditTarget(null);
          await load(q);
        }}
      />

      <Modal
        open={Boolean(fotosTarget)}
        onClose={() => setFotosTarget(null)}
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-lg dark:border dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Fotos y video</div>
        <p className="mb-3 mt-1 text-sm text-slate-500">
          {fotosTarget?.titulo}. Quitar una foto o todas no cambia los datos ni las características.
        </p>
        {fotos.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fotos.map((img) => (
              <div key={img.id} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600">
                {String(img.tipo_media || "").toLowerCase() === "video" ? (
                  <video src={img.url} className="h-28 w-full bg-slate-900 object-cover" />
                ) : (
                  <img src={img.url} alt="" className="h-28 w-full object-cover" />
                )}
                <button
                  type="button"
                  className="w-full px-2 py-2 text-xs font-semibold text-red-600"
                  disabled={busy}
                  onClick={() => quitarFoto(img)}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Esta propiedad no tiene fotos ni video.</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-600" onClick={() => setFotosTarget(null)}>
            Cerrar
          </button>
          {fotos.length ? (
            <button type="button" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={busy} onClick={quitarTodas}>
              Borrar todas las fotos
            </button>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg dark:border dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Eliminar propiedad</div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Se elimina el anuncio completo de {deleteTarget?.titulo}. Si ya tiene reservas, se retira del catálogo y esas reservas se conservan.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-600" onClick={() => setDeleteTarget(null)} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={busy} onClick={eliminarPropiedad}>
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}
