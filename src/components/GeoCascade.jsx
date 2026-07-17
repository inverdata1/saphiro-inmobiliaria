import { useEffect, useState } from "react";
import { apiGet } from "../api";

export default function GeoCascade({ value, onChange }) {
  const v = value || { estado_id: "", ciudad_id: "", sector_id: "" };

  const [estados, setEstados] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [sectores, setSectores] = useState([]);

  useEffect(() => {
    apiGet("/geo/estados").then((r) => setEstados(r.data || [])).catch(() => setEstados([]));
  }, []);

  useEffect(() => {
    if (!v.estado_id) { setCiudades([]); return; }
    apiGet("/geo/ciudades", { estado_id: v.estado_id })
      .then((r) => setCiudades(r.data || []))
      .catch(() => setCiudades([]));
  }, [v.estado_id]);

  useEffect(() => {
    if (!v.ciudad_id) { setSectores([]); return; }
    apiGet("/geo/sectores", { ciudad_id: v.ciudad_id })
      .then((r) => setSectores(r.data || []))
      .catch(() => setSectores([]));
  }, [v.ciudad_id]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 min-w-0">
      <select
        className="border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600"
        value={v.estado_id}
        onChange={(e) => onChange?.({ estado_id: e.target.value, ciudad_id: "", sector_id: "" })}
      >
        <option value="">Estado…</option>
        {estados.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
      </select>

      <select
        className="border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600"
        value={v.ciudad_id}
        disabled={!v.estado_id}
        onChange={(e) => onChange?.({ ...v, ciudad_id: e.target.value, sector_id: "" })}
      >
        <option value="">Ciudad…</option>
        {ciudades.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
      </select>

      <select
        className="border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600"
        value={v.sector_id}
        disabled={!v.ciudad_id}
        onChange={(e) => onChange?.({ ...v, sector_id: e.target.value })}
      >
        <option value="">Sector…</option>
        {sectores.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
      </select>
    </div>
  );
}