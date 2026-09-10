import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiUpload } from "../../api";
import { useAuth } from "../../context/AuthContext";
import ErrorMessage from "../../components/error/ErrorMessage";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function CrearInmueblePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [tipos, setTipos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [caracteristicas, setCaracteristicas] = useState([]);
  const [caracteristicasSel, setCaracteristicasSel] = useState({});
  const [costosDisponibles, setCostosDisponibles] = useState([]);
  const [costosSel, setCostosSel] = useState([]);
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
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [caracteristicasErrs, setCaracteristicasErrs] = useState({});
  const fileRef = useRef(null);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u.url));
  }, [previews]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function set(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
    setFieldErrors((p) => ({ ...p, [k]: "" }));
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    const items = files.map((f) => ({
      id: (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
      file: f,
    }));
    setSelectedFiles((p) => [...p, ...items]);
    setPreviews((p) => [...p, ...items.map((it) => ({ id: it.id, url: URL.createObjectURL(it.file) }))]);
    setFieldErrors((p) => ({ ...p, imagenes: "" }));
  }

  function removeFile(id) {
    setSelectedFiles((p) => p.filter((it) => it.id !== id));
    setPreviews((p) => {
      const target = p.find((it) => it.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return p.filter((it) => it.id !== id);
    });
  }

  useEffect(() => {
    (async () => {
      try {
        const [t, e, c, ca] = await Promise.all([
          apiGet("/tipos"),
          apiGet("/estados"),
          apiGet("/caracteristicas"),
          apiGet("/costos-adicionales"),
        ]);
        setTipos(t.data || []);
        setEstados(e.data || []);
        setCaracteristicas(c.data || []);
        setCostosDisponibles(ca.data || []);
      } catch {}
    })();
  }, []);

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

  useEffect(() => {
    if (!form.estado_id) { setCiudades([]); return; }
    apiGet("/ciudades", { estado_id: form.estado_id })
      .then((r) => setCiudades(r.data || []))
      .catch(() => setCiudades([]));
  }, [form.estado_id]);

  /* ─── Map ─── */
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [10.4806, -66.9036],
      zoom: 13,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([10.4806, -66.9036], { draggable: true }).addTo(map);

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng();
      set("latitud", lat.toFixed(6));
      set("longitud", lng.toFixed(6));
    });

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      set("latitud", lat.toFixed(6));
      set("longitud", lng.toFixed(6));
    });

    mapInstance.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const lat = parseFloat(form.latitud);
    const lng = parseFloat(form.longitud);
    if (lat && lng && markerRef.current && mapInstance.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstance.current.setView([lat, lng], mapInstance.current.getZoom());
    }
  }, [form.latitud, form.longitud]);

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

    if (!selectedFiles.length) errs.imagenes = "Debes cargar al menos una imagen";

    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setErr("Corrige los campos marcados en rojo antes de continuar.");
    }
    return !Object.keys(errs).length;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!validate()) return;
    setLoading(true);
    try {
      const caracteristicas = Object.entries(caracteristicasSel).map(([id, data]) => ({
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
        usuario_id: user?.id ? Number(user.id) : null,
        latitud: form.latitud ? Number(form.latitud) : null,
        longitud: form.longitud ? Number(form.longitud) : null,
        caracteristicas,
      };

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
      }

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      selectedFiles.forEach((it) => fd.append("imagenes", it.file));

      await apiUpload("/inmuebles", fd);

      navigate("/inmuebles");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900";
  const inputClsErr = "border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-700 dark:focus:ring-red-900";
  const labelCls = "text-xs font-semibold text-slate-500 dark:text-slate-400";
  const errMsgCls = "mt-1 text-xs text-red-600 dark:text-red-400";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <nav className="mb-4 flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 font-medium whitespace-nowrap transition-colors hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
        >
          ← Volver
        </button>
      </nav>

      <div className="mb-6">
        <div className="text-2xl font-extrabold dark:text-slate-100">Crear inmueble</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">Ingresa los datos del nuevo inmueble.</div>
      </div>

      <ErrorMessage message={err} onClose={() => setErr("")} />

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className={labelCls}>Título *</label>
          <input className={`${inputCls} ${fieldErrors.titulo ? inputClsErr : ""}`} value={form.titulo} onChange={(e) => { set("titulo", e.target.value); setFieldErrors((p) => ({ ...p, titulo: "" })); }} placeholder="Ej: Apartamento en Bella Vista" />
          {fieldErrors.titulo && <p className={errMsgCls}>{fieldErrors.titulo}</p>}
        </div>

        <div>
          <label className={labelCls}>Descripción</label>
          <textarea className={inputCls + " min-h-[80px]"} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Descripción del inmueble" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls}>Tipo de inmueble *</label>
            <select className={`${inputCls} ${fieldErrors.tipo_inmueble_id ? inputClsErr : ""}`} value={form.tipo_inmueble_id} onChange={(e) => { set("tipo_inmueble_id", e.target.value); setFieldErrors((p) => ({ ...p, tipo_inmueble_id: "" })); }}>
              <option value="">Seleccionar…</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            {fieldErrors.tipo_inmueble_id && <p className={errMsgCls}>{fieldErrors.tipo_inmueble_id}</p>}
          </div>
          <div>
            <label className={labelCls}>Operación *</label>
            <select className={inputCls} value={form.estado_inmueble} onChange={(e) => set("estado_inmueble", e.target.value)}>
              <option value="venta">Venta</option>
              <option value="alquiler_fijo">Alquiler fijo</option>
              <option value="vacacional">Vacacional</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className={form.estado_inmueble === "vacacional" ? "md:col-span-3" : ""}>
            {form.estado_inmueble === "vacacional" && (
              <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
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
              <>
                <label className={labelCls}>{form.estado_inmueble === "vacacional" ? "Monto Inicial" : "Precio"} *</label>
                <input className={`${inputCls} ${fieldErrors.precio ? inputClsErr : ""}`} type="number" min="0" value={form.precio} onChange={(e) => { set("precio", e.target.value); setFieldErrors((p) => ({ ...p, precio: "" })); }} placeholder="0" />
                {fieldErrors.precio && <p className={errMsgCls}>{fieldErrors.precio}</p>}
              </>
            )}
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

        <fieldset>
          <legend className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Características</legend>

          <div className="flex gap-2">
            <select
              className={inputCls + " flex-1"}
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
          </div>

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
                <input className={`${inputCls} ${fieldErrors.precio_por_noche ? inputClsErr : ""}`} type="number" value={form.precio_por_noche} onChange={(e) => { set("precio_por_noche", e.target.value); setFieldErrors((p) => ({ ...p, precio_por_noche: "" })); }} placeholder="0" />
                {fieldErrors.precio_por_noche && <p className={errMsgCls}>{fieldErrors.precio_por_noche}</p>}
              </div>
              <div>
                <label className={labelCls}>Capacidad personas *</label>
                <input className={`${inputCls} ${fieldErrors.capacidad_personas ? inputClsErr : ""}`} type="number" value={form.capacidad_personas} onChange={(e) => { set("capacidad_personas", e.target.value); setFieldErrors((p) => ({ ...p, capacidad_personas: "" })); }} placeholder="0" />
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
                    const costo = costosDisponibles.find((c) => c.id === cs.costo_adicional_id);
                    return (
                      <div key={cs.costo_adicional_id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">{costo?.nombre}</span>
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
              <select className={`${inputCls} ${fieldErrors.estado_id ? inputClsErr : ""}`} value={form.estado_id} onChange={(e) => { set("estado_id", e.target.value); set("ciudad_id", ""); setFieldErrors((p) => ({ ...p, estado_id: "", ciudad_id: "" })); }}>
                <option value="">Seleccionar…</option>
                {estados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
              {fieldErrors.estado_id && <p className={errMsgCls}>{fieldErrors.estado_id}</p>}
            </div>
            <div>
              <label className={labelCls}>Ciudad *</label>
              <select className={`${inputCls} ${fieldErrors.ciudad_id ? inputClsErr : ""}`} value={form.ciudad_id} onChange={(e) => { set("ciudad_id", e.target.value); setFieldErrors((p) => ({ ...p, ciudad_id: "" })); }} disabled={!form.estado_id}>
                <option value="">Seleccionar…</option>
                {ciudades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              {fieldErrors.ciudad_id && <p className={errMsgCls}>{fieldErrors.ciudad_id}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label className={labelCls}>Dirección exacta *</label>
            <textarea className={`${inputCls} ${fieldErrors.direccion_exacta ? inputClsErr : ""} min-h-[60px]`} value={form.direccion_exacta} onChange={(e) => { set("direccion_exacta", e.target.value); setFieldErrors((p) => ({ ...p, direccion_exacta: "" })); }} placeholder="Calle, número, edificio, apto…" />
            {fieldErrors.direccion_exacta && <p className={errMsgCls}>{fieldErrors.direccion_exacta}</p>}
          </div>

          <div className="mt-4">
            <label className={labelCls}>Punto de referencia</label>
            <input className={inputCls} value={form.punto_referencia} onChange={(e) => set("punto_referencia", e.target.value)} placeholder="Ej: Cerca del centro comercial" />
          </div>

          {/* Map */}
          <div className="mt-4">
            <label className={labelCls}>Ubicación en el mapa</label>
            <p className="text-xs text-slate-400 mt-0.5 mb-2">Haz clic en el mapa o arrastra el marcador para señalar la ubicación exacta.</p>
            <div className="h-64 sm:h-72 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600" style={{ isolation: "isolate" }}>
              <div ref={mapRef} className="h-full w-full" />
            </div>
            <div className="mt-2 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>Latitud: {form.latitud || "-"}</span>
              <span>Longitud: {form.longitud || "-"}</span>
            </div>
            {fieldErrors.ubicacion && <p className={errMsgCls}>{fieldErrors.ubicacion}</p>}
          </div>
        </fieldset>

        <div>
          <label className={labelCls}>Imágenes</label>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="mt-1 w-full text-sm text-transparent selection:bg-transparent file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
            onChange={handleFiles}
          />
          {fieldErrors.imagenes && <p className={errMsgCls}>{fieldErrors.imagenes}</p>}
          {previews.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="w-full text-xs text-slate-500 dark:text-slate-400">
                {previews.length} {previews.length === 1 ? "imagen seleccionada" : "imágenes seleccionadas"}
              </span>
              {previews.map((p) => (
                <div key={p.id} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  {previews[0]?.id === p.id ? <span className="absolute left-0 top-0 rounded-br bg-purple-900 px-1 text-[10px] text-white">Portada</span> : null}
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
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer" onClick={() => navigate("/inmuebles")}>
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? "Guardando…" : "Crear inmueble"}
          </button>
        </div>
      </form>
    </div>
  );
}
