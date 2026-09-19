import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../../api";
import SocialIcon from "../../utils/socialIcons.jsx";

const INPUT_STYLE =
  "w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c1c21] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all";

export default function SocialLinksEditor({ usuarioId }) {
  const [catalogo, setCatalogo] = useState([]);
  const [guardadas, setGuardadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState("");
  const [errorSocial, setErrorSocial] = useState("");
  const [guardandoSocial, setGuardandoSocial] = useState(false);
  const [editando, setEditando] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [agregando, setAgregando] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    let mounted = true;

    const cargar = async () => {
      setCargando(true);
      setErrorCatalogo("");
      setErrorSocial("");
      try {
        const [catRes, savedRes] = await Promise.all([
          apiGet("/redes-sociales"),
          usuarioId
            ? apiGet(`/corredores/${usuarioId}/redes-sociales`)
            : Promise.resolve(null),
        ]);
        if (!mounted) return;

        const catData = catRes?.data ?? catRes ?? [];
        setCatalogo(
          Array.isArray(catData)
            ? catData.map((p) => ({
                id: p.id,
                nombre: p.nombre,
                base_url: p.base_url,
                name_icon: p.name_icon,
                url_ejemplo: `${p.base_url.replace("https://", "")}tu-usuario`,
              }))
            : []
        );

        if (savedRes) {
          const savedData = savedRes?.data ?? savedRes ?? [];
          setGuardadas(
            Array.isArray(savedData)
              ? savedData.map((r) => ({
                  id: r.id,
                  red_social_id: r.red_social_id,
                  url: r.url,
                  orden: r.orden,
                }))
              : []
          );
        }
      } catch (e) {
        if (mounted)
          setErrorCatalogo(e?.message || "Error al cargar las redes sociales.");
      } finally {
        if (mounted) setCargando(false);
      }
    };

    cargar();

    return () => {
      mounted = false;
    };
  }, [usuarioId]);

  const redes = guardadas
    .slice()
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((rec) => {
      const cat = catalogo.find((c) => c.id === rec.red_social_id);
      return cat ? { catalogo: cat, record: rec } : null;
    })
    .filter(Boolean);

  const agregadasIds = new Set(guardadas.map((r) => r.red_social_id));
  const disponibles = catalogo.filter((p) => !agregadasIds.has(p.id));

  const entrarEditar = () => {
    setEditando(true);
    setShowSelector(false);
    setAgregando(null);
    setEditandoId(null);
    setUrlInput("");
  };

  const listo = () => {
    setEditando(false);
    setShowSelector(false);
    setAgregando(null);
    setEditandoId(null);
    setUrlInput("");
  };

  const toggleEdicion = (id, url) => {
    if (editandoId === id) {
      setEditandoId(null);
      setUrlInput("");
      return;
    }
    setEditandoId(id);
    setAgregando(null);
    setShowSelector(false);
    setUrlInput(url || "");
  };

  const guardarEdicion = async (id) => {
    const url = urlInput.trim();
    if (!url || !usuarioId) return;

    setGuardandoSocial(true);
    setErrorSocial("");
    try {
      await apiPut(`/corredores/${usuarioId}/redes-sociales/${id}`, { url });
      setGuardadas((prev) => prev.map((r) => (r.id === id ? { ...r, url } : r)));
      setEditandoId(null);
      setUrlInput("");
    } catch (err) {
      setErrorSocial(err?.message || "Error al actualizar la red social.");
    } finally {
      setGuardandoSocial(false);
    }
  };

  const abrirInput = (id) => {
    setAgregando(id);
    setUrlInput("");
  };

  const confirmar = async (id) => {
    const url = urlInput.trim();
    if (!url || !usuarioId) return;

    setGuardandoSocial(true);
    setErrorSocial("");
    try {
      const res = await apiPost(`/corredores/${usuarioId}/redes-sociales`, {
        red_social_id: id,
        url,
      });
      const data = res?.data || res;
      setGuardadas((prev) => [
        ...prev,
        {
          id: data.id,
          red_social_id: data.red_social_id,
          url: data.url,
          orden: data.orden,
        },
      ]);
      setAgregando(null);
      setUrlInput("");
    } catch (err) {
      setErrorSocial(err?.message || "Error al agregar la red social.");
    } finally {
      setGuardandoSocial(false);
    }
  };

  const eliminar = async (recId) => {
    if (!usuarioId) return;

    setErrorSocial("");
    try {
      await apiDelete(`/corredores/${usuarioId}/redes-sociales/${recId}`);
      setGuardadas((prev) => prev.filter((r) => r.id !== recId));
      setShowSelector(false);
      setAgregando(null);
      setUrlInput("");
    } catch (err) {
      setErrorSocial(err?.message || "Error al eliminar la red social.");
    }
  };

  const mostrarUrl = (r) =>
    r.record.url && r.record.url.trim() ? r.record.url : r.catalogo.url_ejemplo;

  return (
    <div className="bg-white dark:bg-[#141417] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-7 shadow-xs">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-6">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Redes Sociales
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Comparte tus redes para que tus clientes te encuentren fácilmente.
          </p>
        </div>

        {!editando && (
          <button
            type="button"
            onClick={entrarEditar}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Editar
          </button>
        )}
      </div>

      {errorSocial && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-400 flex items-start justify-between gap-2">
          <span className="flex-1">{errorSocial}</span>
          <button
            type="button"
            onClick={() => setErrorSocial("")}
            className="font-bold cursor-pointer shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {cargando ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : errorCatalogo ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/60 py-8 text-center text-sm text-red-600 dark:text-red-400">
          {errorCatalogo}
        </div>
      ) : redes.length ? (
        <ul className="space-y-3">
          {redes.map((r) => (
            <li key={r.record.id} className="space-y-2">
              {editando && editandoId === r.record.id ? (
                <div className="flex-1 flex flex-col gap-2 px-3 py-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-purple-300 dark:border-purple-700">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: "#5a0e82" }}
                    >
                      <SocialIcon name={r.catalogo.name_icon} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Editar {r.catalogo.nombre}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {r.catalogo.base_url}tu-usuario
                      </p>
                    </div>
                  </div>
                  <input
                    type="url"
                    autoFocus
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && guardarEdicion(r.record.id)}
                    placeholder={`${r.catalogo.base_url}tu-usuario`}
                    className={INPUT_STYLE}
                    disabled={guardandoSocial}
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => guardarEdicion(r.record.id)}
                      disabled={!urlInput.trim() || urlInput.trim() === (r.record.url || "").trim() || guardandoSocial}
                      title="Actualizar link"
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      style={{ backgroundColor: "#5a0e82" }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoId(null);
                        setUrlInput("");
                      }}
                      title="Cancelar"
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 inline-flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: "#5a0e82" }}
                  >
                    <SocialIcon name={r.catalogo.name_icon} size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {r.catalogo.nombre}
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {mostrarUrl(r)}
                    </p>
                  </div>

                  {editando && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleEdicion(r.record.id, r.record.url)}
                        title={`Editar ${r.catalogo.nombre}`}
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-800 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(r.record.id)}
                        title={`Eliminar ${r.catalogo.nombre}`}
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-red-200 dark:border-red-900/60 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-800 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
          {editando
            ? "Aún no hay redes agregadas. Usa el botón de abajo para añadir."
            : "Este corredor aún no ha agregado redes sociales."}
        </div>
      )}

      {editando && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => {
              setShowSelector((s) => !s);
              setAgregando(null);
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-dashed border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar red social
          </button>

          {showSelector && (
            <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3 space-y-2">
              {disponibles.length ? (
                disponibles.map((p) =>
                  agregando === p.id ? (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-[#1c1c21] border border-purple-300 dark:border-purple-700"
                    >
                      <span
                        className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: "#5a0e82" }}
                      >
                        <SocialIcon name={p.name_icon} size={16} />
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Link de {p.nombre}
                        </div>
                        <input
                          type="url"
                          autoFocus
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && confirmar(p.id)}
                          placeholder={p.url_ejemplo}
                          className={INPUT_STYLE}
                          disabled={guardandoSocial}
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => confirmar(p.id)}
                          disabled={!urlInput.trim() || guardandoSocial}
                          title="Guardar link"
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          style={{ backgroundColor: "#5a0e82" }}
                          onMouseEnter={(e) => urlInput.trim() && !guardandoSocial && (e.currentTarget.style.backgroundColor = "#470A68")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#5a0e82")}
                        >
                          {guardandoSocial ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAgregando(null)}
                          title="Cancelar"
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 inline-flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => abrirInput(p.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-white dark:hover:bg-[#1c1c21] border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors cursor-pointer group"
                    >
                      <span
                        className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: "#5a0e82" }}
                      >
                        <SocialIcon name={p.name_icon} size={16} />
                      </span>
                      <span className="flex-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {p.nombre}
                      </span>
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 group-hover:underline">
                        Agregar
                      </span>
                    </button>
                  )
                )
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  Todas las redes ya están agregadas.
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-end border-t border-slate-100 dark:border-slate-800/80 mt-5">
            <button
              type="button"
              onClick={listo}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer"
              style={{ backgroundColor: "#5a0e82" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#470A68")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#5a0e82")}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}