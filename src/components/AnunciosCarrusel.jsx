import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api";

export default function AnunciosCarrusel() {
  const [data, setData] = useState({ anuncios: [], destacados: [] });

  useEffect(() => {
    apiGet("/planes/portada")
      .then((r) => setData(r?.data || { anuncios: [], destacados: [] }))
      .catch(() => {});
  }, []);

  const anuncios = (data.anuncios || []).filter((a) => a.posicion !== "lateral");
  const destacados = data.destacados || [];
  if (!anuncios.length && !destacados.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Anuncios</h2>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {anuncios.map((a) => (
          <a
            key={`a-${a.id}`}
            href={a.enlace}
            target="_blank"
            rel="noreferrer"
            className="min-w-[260px] flex-1 rounded-2xl bg-slate-900 p-5 text-white"
          >
            <div className="text-xs uppercase tracking-wide text-amber-300">Publicidad</div>
            <div className="mt-2 text-lg font-bold">{a.titulo}</div>
            <div className="mt-1 text-sm text-white/80">{a.empresa}</div>
          </a>
        ))}
        {destacados.map((p) => (
          <Link
            key={`d-${p.id}`}
            to={`/inmuebles/${p.id}`}
            className="min-w-[260px] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
          >
            {p.imagen_url ? <img src={p.imagen_url} alt="" className="h-36 w-full object-cover" /> : <div className="h-36 bg-amber-100" />}
            <div className="p-4">
              <div className="text-xs font-bold uppercase text-amber-600">Destacado</div>
              <div className="mt-1 font-bold text-slate-900 dark:text-white">{p.titulo}</div>
              <div className="text-sm text-slate-500">{p.ciudad}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function AnuncioLateral() {
  const [anuncios, setAnuncios] = useState([]);
  useEffect(() => {
    apiGet("/planes/portada")
      .then((r) => setAnuncios((r?.data?.anuncios || []).filter((a) => a.posicion === "lateral")))
      .catch(() => {});
  }, []);
  if (!anuncios.length) return null;
  return (
    <div className="mt-4 space-y-3">
      {anuncios.map((a) => (
        <a key={a.id} href={a.enlace} target="_blank" rel="noreferrer" className="block rounded-2xl bg-slate-900 p-4 text-white">
          <div className="text-[10px] uppercase tracking-wide text-amber-300">Banner</div>
          <div className="mt-1 font-bold">{a.titulo}</div>
          <div className="text-sm text-white/80">{a.empresa}</div>
        </a>
      ))}
    </div>
  );
}
