import { useEffect, useState, useRef, useCallback } from "react";
import { apiGet, apiUpload } from "../api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ─── mapa interactivo (monta solo con el modal abierto) ─── */
function MapaPin({ latitud, longitud, onChange }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const wrapRef = useRef(null);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setActivo(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    const lat = parseFloat(latitud) || 10.4806;
    const lng = parseFloat(longitud) || -66.9036;

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 13,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    marker.on("dragend", () => {
      const { lat: la, lng: lo } = marker.getLatLng();
      onChange(la.toFixed(6), lo.toFixed(6));
    });

    map.on("click", (e) => {
      const { lat: la, lng: lo } = e.latlng;
      marker.setLatLng([la, lo]);
      onChange(la.toFixed(6), lo.toFixed(6));
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative h-64 sm:h-72 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600"
      style={{ isolation: "isolate" }}
    >
      <div ref={mapRef} className="h-full w-full" />
      {!activo && (
        <button
          type="button"
          onClick={() => setActivo(true)}
          title="Haz clic para activar el mapa"
          className="absolute inset-0 z-[1001] flex items-end justify-center bg-transparent pb-3 cursor-pointer"
        >
          <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white shadow-lg">
            Haz clic para activar el mapa…
          </span>
        </button>
      )}
    </div>
  );
}

export default function EditarInmuebleModal({ open, onClose, inmueble, caracteristicasIniciales = [], usuarioId, onSaved }) {
  const [tipos, setTipos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [caracteristicas, setCaracteristicas] = useState([]);
  const [caracteristicasSel, setCaracteristicasSel] = useState({});
  const [costosDisponibles, setCostosDisponibles] = useState([]);
  const [costosSel, setCostosSel] = useState([]);
  const [mascotasDisponibles, setMascotasDisponibles] = useState([]);
  const [mascotasSel, setMascotasSel] = useState([]);
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef(null);
  const [coordCache, setCoordCache] = useState({ latitud: "", longitud: "" });
  const [guardando, setGuardando] = useState(false);
  const [guardarError, setGuardarError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [caracteristicasErrs, setCaracteristicasErrs] = useState({});

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    tipo_inmueble_id: "",
    estado_inmueble: "venta",
    montoInicial: true,
    moneda: "BS",
    precio: "",
    area_m2: "",
    estado_id: "",
    ciudad_id: "",
    direccion_exacta: "",
    punto_referencia: "",
    latitud: "10.4806",
    longitud: "-66.9036",
    precio_por_noche: "",
    capacidad_personas: "",
    noches_minimas: "1",
    hora_checkin: "",
    hora_checkout: "",
    permite_mascotas: false,
    permite_infantes: false,
  });

  function set(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
    setFieldErrors((p) => ({ ...p, [k]: "" }));
  }

  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u.url));
  }, [previews]);

  useEffect(() => {
    (async () => {
      try {
        const [t, e, c, ca, m] = await Promise.all([
          apiGet("/tipos"),
          apiGet("/estados"),
          apiGet("/caracteristicas"),
          apiGet("/costos-adicionales"),
          apiGet("/mascotas"),
        ]);
        setTipos(t.data || []);
        setEstados(e.data || []);
        setCaracteristicas(c.data || []);
        setCostosDisponibles(ca.data || []);
        setMascotasDisponibles(m.data || []);
      } catch {}
    })();
  }, []);

  /* ─── prellenar con datos del inmueble al abrir ─── */
  const initDesdeInmueble = useCallback(() => {
    if (!inmueble) return;

    const estadoId =
      estados.find((s) => s.nombre === inmueble.estado)?.id ?? "";
    const vac = inmueble.alquiler_vacacional || {};

    setForm({
      titulo: inmueble.titulo || "",
      descripcion: inmueble.descripcion || "",
      tipo_inmueble_id: String(inmueble.tipo_inmueble_id || ""),
      estado_inmueble: inmueble.estado_inmueble || "venta",
      montoInicial: Number(inmueble.precio) > 0,
      moneda: inmueble.moneda || "BS",
      precio: inmueble.precio ?? "",
      area_m2: inmueble.area_m2 ?? "",
      estado_id: estadoId ? String(estadoId) : "",
      ciudad_id: String(inmueble.ciudad_id || ""),
      direccion_exacta: inmueble.direccion_exacta || "",
      punto_referencia: inmueble.punto_referencia || "",
      latitud: inmueble.latitud || "10.4806",
      longitud: inmueble.longitud || "-66.9036",
      precio_por_noche: vac.precio_por_noche ?? "",
      capacidad_personas: vac.capacidad_personas ?? "",
      noches_minimas: vac.noches_minimas ?? "1",
      hora_checkin: vac.hora_checkin || "",
      hora_checkout: vac.hora_checkout || "",
      permite_mascotas: Array.isArray(inmueble.mascotas) && inmueble.mascotas.length > 0,
      permite_infantes: vac.permiso_infantes ?? true,
    });

    setCoordCache({
      latitud: inmueble.latitud || "10.4806",
      longitud: inmueble.longitud || "-66.9036",
    });

    const sel = {};
    caracteristicasIniciales.forEach((c) => {
      if (c.caracteristica_id) sel[c.caracteristica_id] = { valor: c.valor ?? null };
    });
    setCaracteristicasSel(sel);

    setCostosSel(
      Array.isArray(inmueble.costos_adicionales)
        ? inmueble.costos_adicionales.map((c) => ({
            costo_adicional_id: c.costo_adicional_id,
            descripcion: "",
            monto: String(c.monto ?? ""),
          }))
        : []
    );

    setMascotasSel(
      Array.isArray(inmueble.mascotas)
        ? inmueble.mascotas.map((m) => Number(m.mascota_id))
        : []
    );

    setImagenesExistentes(
      Array.isArray(inmueble.imagenes) ? inmueble.imagenes : []
    );
    setSelectedFiles([]);
    setPreviews([]);
    setFieldErrors({});
    setCaracteristicasErrs({});
    setGuardarError("");
    if (fileRef.current) fileRef.current.value = "";
  }, [inmueble, estados, caracteristicasIniciales]);

  useEffect(() => {
    if (open) initDesdeInmueble();
  }, [open, initDesdeInmueble]);

  useEffect(() => {
    if (!open || form.estado_id || !inmueble?.estado) return;
    const e = estados.find((s) => s.nombre === inmueble.estado);
    if (e) set("estado_id", String(e.id));
  }, [estados, open, form.estado_id, inmueble]);

  useEffect(() => {
    if (!form.estado_id) { setCiudades([]); return; }
    apiGet("/ciudades", { estado_id: form.estado_id })
      .then((r) => setCiudades(r.data || []))
      .catch(() => setCiudades([]));
  }, [form.estado_id]);

  /* ─── características ─── */
  function agregarCaracteristica(id) {
    const c = caracteristicas.find((x) => x.id === id);
    if (!c || caracteristicasSel[id]) return;
    setCaracteristicasSel((prev) => ({
      ...prev,
      [id]: { valor: c.unidad_medicion ? "" : null },
    }));
  }

  function quitarCaracteristica(id) {
    setCaracteristicasSel((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setCaracteristicasErrs((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
  }

  function setCaracteristicaValor(id, valor) {
    setCaracteristicasSel((prev) => ({
      ...prev,
      [id]: { ...prev[id], valor },
    }));
    setCaracteristicasErrs((p) => ({ ...p, [id]: "" }));
  }

  /* ─── costos adicionales ─── */
  function agregarCosto(id) {
    if (costosSel.some((c) => c.costo_adicional_id === id)) return;
    setCostosSel((prev) => [...prev, { costo_adicional_id: id, descripcion: "", monto: "" }]);
  }

  function quitarCosto(id) {
    setCostosSel((prev) => prev.filter((c) => c.costo_adicional_id !== id));
  }

  function setCostoField(id, field, value) {
    setCostosSel((prev) => prev.map((c) => c.costo_adicional_id === id ? { ...c, [field]: value } : c));
  }

  /* ─── mascotas ─── */
  function agregarMascota(id) {
    if (mascotasSel.includes(Number(id))) return;
    setMascotasSel((prev) => [...prev, Number(id)]);
  }

  function quitarMascota(id) {
    setMascotasSel((prev) => prev.filter((m) => m !== Number(id)));
  }

  /* ─── imágenes ─── */
  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    const items = files.map((f) => ({
      id: (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
      file: f,
    }));
    setSelectedFiles((p) => [...p, ...items]);
    setPreviews((p) => [...p, ...items.map((it) => ({ id: it.id, url: URL.createObjectURL(it.file) }))]);
  }

  function removeFile(id) {
    setSelectedFiles((p) => p.filter((it) => it.id !== id));
    setPreviews((p) => {
      const target = p.find((it) => it.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return p.filter((it) => it.id !== id);
    });
  }

  function quitarImagenExistente(id) {
    setImagenesExistentes((p) => p.filter((img) => img.id !== id));
  }

  const inputCls = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900";
  const labelCls = "text-xs font-semibold text-slate-500 dark:text-slate-400";
  const inputClsErr = "border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-700 dark:focus:ring-red-900";
  const errMsgCls = "mt-1 text-xs text-red-600 dark:text-red-400";

  function validate() {
    const errs = {};
    if (!form.titulo?.trim()) errs.titulo = "El título es obligatorio";
    if (!form.tipo_inmueble_id) errs.tipo_inmueble_id = "Selecciona un tipo de inmueble";
    if (!form.precio || Number(form.precio) <= 0) {
      if (!(form.estado_inmueble === "vacacional" && form.montoInicial === false)) {
        errs.precio = "Ingresa un precio válido";
      }
    }
    if (!form.estado_id) errs.estado_id = "Selecciona un estado";
    if (!form.ciudad_id) errs.ciudad_id = "Selecciona una ciudad";
    if (!form.direccion_exacta?.trim()) errs.direccion_exacta = "La dirección es obligatoria";
    if (!form.latitud || !form.longitud) errs.ubicacion = "Señala la ubicación en el mapa";
    if (form.estado_inmueble === "vacacional") {
      if (!form.precio_por_noche || Number(form.precio_por_noche) <= 0) errs.precio_por_noche = "Precio por noche requerido";
      if (!form.capacidad_personas || Number(form.capacidad_personas) <= 0) errs.capacidad_personas = "Capacidad requerida";
    }

    const carctErrs = {};
    Object.entries(caracteristicasSel).forEach(([id, data]) => {
      const c = caracteristicas.find((x) => x.id === Number(id));
      if (c?.unidad_medicion && !String(data.valor ?? "").trim()) {
        carctErrs[id] = "Ingresa un valor";
      }
    });
    setCaracteristicasErrs(carctErrs);
    if (Object.keys(carctErrs).length) errs.caracteristicas = true;

    if (!imagenesExistentes.length && !selectedFiles.length) errs.imagenes = "El inmueble debe tener al menos una imagen";

    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setGuardarError("Corrige los campos marcados en rojo antes de continuar.");
    }
    return !Object.keys(errs).length;
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setGuardarError("");
    if (!validate()) return;
    setGuardando(true);
    try {
      const caracteristicasPayload = Object.entries(caracteristicasSel).map(([id, data]) => ({
        caracteristica_id: Number(id),
        valor: data.valor,
      }));

      const payload = {
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        tipo_inmueble_id: form.tipo_inmueble_id ? Number(form.tipo_inmueble_id) : null,
        estado_inmueble: form.estado_inmueble,
        precio: form.precio ? Number(form.precio) : null,
        moneda: form.moneda,
        area_m2: form.area_m2 ? Number(form.area_m2) : null,
        ciudad_id: form.ciudad_id ? Number(form.ciudad_id) : null,
        direccion_exacta: form.direccion_exacta || null,
        punto_referencia: form.punto_referencia || null,
        usuario_id: usuarioId ? Number(usuarioId) : null,
        latitud: form.latitud ? Number(form.latitud) : null,
        longitud: form.longitud ? Number(form.longitud) : null,
        caracteristicas: caracteristicasPayload,
      };

      const imagenesOriginales = Array.isArray(inmueble?.imagenes) ? inmueble.imagenes : [];
      const idsEliminadas = imagenesOriginales
        .map((img) => img.id)
        .filter((imgId) => !imagenesExistentes.some((img) => img.id === imgId));

      if (idsEliminadas.length) payload.borrar_imagenes = idsEliminadas;

      if (form.estado_inmueble === "vacacional") {
        payload.precio_por_noche = Number(form.precio_por_noche);
        payload.capacidad_personas = Number(form.capacidad_personas);
        payload.noches_minimas = form.noches_minimas ? Number(form.noches_minimas) : 1;
        payload.hora_checkin = form.hora_checkin || null;
        payload.hora_checkout = form.hora_checkout || null;
        payload.costos_adicionales = costosSel.map((c) => ({
          costo_adicional_id: c.costo_adicional_id,
          monto: c.monto ? Number(c.monto) : 0,
        }));
        payload.mascotas = mascotasSel.map((mascotaId) => ({ mascota_id: mascotaId }));
        payload.permiso_infantes = form.permite_infantes;
      }

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      selectedFiles.forEach((it) => fd.append("imagenes", it.file));

      await apiUpload(`/inmuebles/${inmueble?.id}`, fd, "PUT");

      await onSaved?.();
    } catch (err) {
      setGuardarError(err?.message || "Error al guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl max-h-[88vh] overflow-y-auto scrollbar-custom rounded-2xl bg-white shadow-2xl dark:bg-slate-800 dark:border dark:border-slate-700">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
          <div>
            <div className="text-xl font-extrabold dark:text-slate-100">Editar inmueble</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {inmueble?.titulo || "Inmueble"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleGuardar}
          className="p-6 space-y-5"
        >
          {guardarError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {guardarError}
            </div>
          )}
          <div>
            <label className={labelCls}>Título *</label>
            <input className={`${inputCls} ${fieldErrors.titulo ? inputClsErr : ""}`} value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ej: Apartamento en Bella Vista" />
            {fieldErrors.titulo && <p className={errMsgCls}>{fieldErrors.titulo}</p>}
          </div>

          <div>
            <label className={labelCls}>Descripción</label>
            <textarea className={inputCls + " min-h-[80px]"} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Descripción del inmueble" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className={labelCls}>Tipo de inmueble *</label>
              <select className={`${inputCls} ${fieldErrors.tipo_inmueble_id ? inputClsErr : ""}`} value={form.tipo_inmueble_id} onChange={(e) => set("tipo_inmueble_id", e.target.value)}>
                <option value="">Seleccionar…</option>
                {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
              {fieldErrors.tipo_inmueble_id && <p className={errMsgCls}>{fieldErrors.tipo_inmueble_id}</p>}
            </div>
            <div>
              <label className={labelCls}>Moneda</label>
              <select className={inputCls} value={form.moneda} onChange={(e) => set("moneda", e.target.value)}>
                <option value="BS">BS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Área (m²)</label>
              <input className={inputCls} type="number" value={form.area_m2} onChange={(e) => set("area_m2", e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {form.estado_inmueble === "vacacional" && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.montoInicial}
                  onChange={(e) => {
                    set("montoInicial", e.target.checked);
                    if (!e.target.checked) set("precio", "0");
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-purple-900 focus:ring-purple-900 accent-purple-900"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  ¿El vacacional tiene un monto inicial?
                </span>
              </label>
            )}
            {form.estado_inmueble === "vacacional" && !form.montoInicial ? null : (
              <div>
                <label className={labelCls}>
                  {form.estado_inmueble === "vacacional" ? "Monto Inicial" : "Precio"} *
                </label>
                <input className={`${inputCls} ${fieldErrors.precio ? inputClsErr : ""}`} type="number" min="0" value={form.precio} onChange={(e) => set("precio", e.target.value)} placeholder="0" />
                {fieldErrors.precio && <p className={errMsgCls}>{fieldErrors.precio}</p>}
              </div>
            )}
          </div>

          <fieldset>
            <legend className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Características</legend>

            <select
              className={inputCls}
              value=""
              onChange={(e) => {
                if (e.target.value) agregarCaracteristica(Number(e.target.value));
                e.target.value = "";
              }}
            >
              <option value="">Agregar característica…</option>
              {caracteristicas
                .filter((c) => !caracteristicasSel[c.id])
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
            </select>

            {Object.keys(caracteristicasSel).length > 0 && (
              <div className="mt-3 space-y-2">
                {Object.entries(caracteristicasSel).map(([id, data]) => {
                  const c = caracteristicas.find((x) => x.id === Number(id));
                  if (!c) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">{c.nombre}</span>
                      {c.unidad_medicion ? (
                        <>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={data.valor}
                            onChange={(e) => setCaracteristicaValor(Number(id), e.target.value)}
                            placeholder="Valor"
                            className={`w-20 rounded-lg border px-2 py-1 text-xs text-right focus:border-blue-400 focus:outline-none dark:bg-slate-700 dark:text-slate-100 ${
                              caracteristicasErrs[id]
                                ? "border-red-400 dark:border-red-700"
                                : "border-slate-200 dark:border-slate-600"
                            }`}
                          />
                          <span className="text-xs text-slate-400">{c.unidad_medicion}</span>
                        </div>
                        {caracteristicasErrs[id] && (
                          <span className="text-xs text-red-600 dark:text-red-400">{caracteristicasErrs[id]}</span>
                        )}
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Sí</span>
                      )}
                      <button
                        type="button"
                        onClick={() => quitarCaracteristica(Number(id))}
                        className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </fieldset>

          {form.estado_inmueble === "vacacional" && (
            <fieldset>
              <legend className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Datos de alquiler vacacional</legend>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Precio por noche *</label>
                  <input className={`${inputCls} ${fieldErrors.precio_por_noche ? inputClsErr : ""}`} type="number" value={form.precio_por_noche} onChange={(e) => set("precio_por_noche", e.target.value)} placeholder="0" />
                  {fieldErrors.precio_por_noche && <p className={errMsgCls}>{fieldErrors.precio_por_noche}</p>}
                </div>
                <div>
                  <label className={labelCls}>Capacidad personas *</label>
                  <input className={`${inputCls} ${fieldErrors.capacidad_personas ? inputClsErr : ""}`} type="number" value={form.capacidad_personas} onChange={(e) => set("capacidad_personas", e.target.value)} placeholder="0" />
                  {fieldErrors.capacidad_personas && <p className={errMsgCls}>{fieldErrors.capacidad_personas}</p>}
                </div>
                <div>
                  <label className={labelCls}>Noches mínimas</label>
                  <input className={inputCls} type="number" value={form.noches_minimas} onChange={(e) => set("noches_minimas", e.target.value)} placeholder="1" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
                <div>
                  <label className={labelCls}>Hora de entrada</label>
                  <input className={inputCls} type="time" value={form.hora_checkin} onChange={(e) => set("hora_checkin", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Hora de salida</label>
                  <input className={inputCls} type="time" value={form.hora_checkout} onChange={(e) => set("hora_checkout", e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <label className={labelCls}>Reglas</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 cursor-pointer select-none dark:border-slate-700 dark:bg-slate-800">
                    <input
                      type="checkbox"
                      checked={form.permite_mascotas}
                      onChange={(e) => {
                        set("permite_mascotas", e.target.checked);
                        if (!e.target.checked) setMascotasSel([]);
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-purple-900 focus:ring-purple-900 accent-purple-900"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      ¿Se permitirán mascotas?
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 cursor-pointer select-none dark:border-slate-700 dark:bg-slate-800">
                    <input
                      type="checkbox"
                      checked={form.permite_infantes}
                      onChange={(e) => set("permite_infantes", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-purple-900 focus:ring-purple-900 accent-purple-900"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      ¿Se permitirán infantes?
                    </span>
                  </label>
                </div>
              </div>

              {form.permite_mascotas && (
                <div className="mt-4">
                  <label className={labelCls}>Mascotas permitidas</label>
                  <select
                    className={inputCls + " mt-1"}
                    value=""
                    onChange={(e) => {
                      if (e.target.value) agregarMascota(Number(e.target.value));
                      e.target.value = "";
                    }}
                  >
                    <option value="">Agregar mascota…</option>
                    {mascotasDisponibles
                      .filter((m) => !mascotasSel.includes(m.id))
                      .map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                  </select>

                  {mascotasSel.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {mascotasSel.map((mascotaId) => {
                        const mascota = mascotasDisponibles.find((m) => m.id === mascotaId) ||
                          (Array.isArray(inmueble?.mascotas) ? inmueble.mascotas.find((m) => Number(m.mascota_id) === mascotaId) : null);
                        return (
                          <div key={mascotaId} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">{mascota?.nombre || `Mascota ${mascotaId}`}</span>
                            <button
                              type="button"
                              onClick={() => quitarMascota(mascotaId)}
                              className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4">
                <label className={labelCls}>Costos adicionales</label>
                <select
                  className={inputCls + " mt-1"}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) agregarCosto(Number(e.target.value));
                    e.target.value = "";
                  }}
                >
                  <option value="">Agregar costo…</option>
                  {costosDisponibles
                    .filter((c) => !costosSel.some((s) => s.costo_adicional_id === c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                </select>

                {costosSel.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {costosSel.map((cs) => {
                      const costo = costosDisponibles.find((c) => c.id === cs.costo_adicional_id) ||
                        (Array.isArray(inmueble?.costos_adicionales)
                          ? { nombre: inmueble.costos_adicionales.find((c) => c.costo_adicional_id === cs.costo_adicional_id)?.costo_adicional_nombre }
                          : null);
                      return (
                        <div key={cs.costo_adicional_id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">{costo?.nombre || `Costo ${cs.costo_adicional_id}`}</span>
                          <input
                            type="number"
                            value={cs.monto}
                            onChange={(e) => setCostoField(cs.costo_adicional_id, "monto", e.target.value)}
                            placeholder="Monto"
                            className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs text-right focus:border-blue-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => quitarCosto(cs.costo_adicional_id)}
                            className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Ubicación</legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>Estado *</label>
                <select className={`${inputCls} ${fieldErrors.estado_id ? inputClsErr : ""}`} value={form.estado_id} onChange={(e) => { set("estado_id", e.target.value); set("ciudad_id", ""); }}>
                  <option value="">Seleccionar…</option>
                  {estados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
                {fieldErrors.estado_id && <p className={errMsgCls}>{fieldErrors.estado_id}</p>}
              </div>
              <div>
                <label className={labelCls}>Ciudad *</label>
                <select className={`${inputCls} ${fieldErrors.ciudad_id ? inputClsErr : ""}`} value={form.ciudad_id} onChange={(e) => set("ciudad_id", e.target.value)} disabled={!form.estado_id}>
                  <option value="">Seleccionar…</option>
                  {ciudades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {fieldErrors.ciudad_id && <p className={errMsgCls}>{fieldErrors.ciudad_id}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label className={labelCls}>Dirección exacta *</label>
              <textarea className={`${inputCls} ${fieldErrors.direccion_exacta ? inputClsErr : ""} min-h-[60px]`} value={form.direccion_exacta} onChange={(e) => set("direccion_exacta", e.target.value)} placeholder="Calle, número, edificio, apto…" />
              {fieldErrors.direccion_exacta && <p className={errMsgCls}>{fieldErrors.direccion_exacta}</p>}
            </div>

            <div className="mt-4">
              <label className={labelCls}>Punto de referencia</label>
              <input className={inputCls} value={form.punto_referencia} onChange={(e) => set("punto_referencia", e.target.value)} placeholder="Ej: Cerca del centro comercial" />
            </div>

            <div className="mt-4">
              <label className={labelCls}>Ubicación en el mapa</label>
              <p className="text-xs text-slate-400 mt-0.5 mb-2">Haz clic en el mapa o arrastra el marcador para señalar la ubicación exacta.</p>
              <MapaPin
                latitud={coordCache.latitud}
                longitud={coordCache.longitud}
                onChange={(lat, lng) => {
                  setCoordCache({ latitud: lat, longitud: lng });
                  set("latitud", lat);
                  set("longitud", lng);
                }}
              />
<div className="mt-2 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>Latitud: {form.latitud || "-"}</span>
                  <span>Longitud: {form.longitud || "-"}</span>
                </div>
                {fieldErrors.ubicacion && <p className={errMsgCls}>{fieldErrors.ubicacion}</p>}
            </div>
          </fieldset>

          <div>
            <label className={labelCls}>Imágenes</label>

            {imagenesExistentes.length > 0 && (
              <div className="mt-2">
                <span className="w-full text-xs text-slate-500 dark:text-slate-400">
                  {imagenesExistentes.length} {imagenesExistentes.length === 1 ? "imagen actual" : "imágenes actuales"}
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {imagenesExistentes.map((img) => (
                    <div key={img.id} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                      {imagenesExistentes[0]?.id === img.id ? <span className="absolute left-0 top-0 rounded-br bg-purple-900 px-1 text-[10px] text-white">Portada</span> : null}
                      <button
                        type="button"
                        onClick={() => quitarImagenExistente(img.id)}
                        title="Quitar imagen"
                        className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 group-hover:flex cursor-pointer"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="mt-3 w-full text-sm text-transparent selection:bg-transparent file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
              onChange={handleFiles}
            />

            {previews.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="w-full text-xs text-slate-500 dark:text-slate-400">
                  {previews.length} {previews.length === 1 ? "imagen seleccionada" : "imágenes seleccionadas"} (nueva{previews.length === 1 ? "" : "s"})
                </span>
                {previews.map((p) => (
                  <div key={p.id} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(p.id)}
                      title="Quitar imagen"
                      className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 group-hover:flex cursor-pointer"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {fieldErrors.imagenes && <p className={errMsgCls}>{fieldErrors.imagenes}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              onClick={onClose}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-primary disabled:opacity-60">
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}