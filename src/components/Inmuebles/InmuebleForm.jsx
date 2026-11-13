import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiUpload } from "../../api";
import { useAuth } from "../../context/useAuth";
import ErrorMessage from "../error/ErrorMessage";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const UMBRAL_REVERSE_M = 100;

function distanciaMetros(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function InmuebleForm({
  edit = false,
  inmueble,
  caracteristicasIniciales = [],
  onCancel,
  onSaved,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [corredores, setCorredores] = useState([]);
  const [corredorUsuarioId, setCorredorUsuarioId] = useState("");
  const esAdmin = user?.rol === "admin";

  useEffect(() => {
    if (!esAdmin) return;
    apiGet("/corredores?limit=200")
      .then((r) => setCorredores(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setCorredores([]));
  }, [esAdmin]);

  const [tipos, setTipos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [caracteristicas, setCaracteristicas] = useState([]);
  const [caracteristicasSel, setCaracteristicasSel] = useState({});
  const [costosDisponibles, setCostosDisponibles] = useState([]);
  const [costosSel, setCostosSel] = useState([]);
  const [mascotasDisponibles, setMascotasDisponibles] = useState([]);
  const [mascotasSel, setMascotasSel] = useState([]);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    tipo_inmueble_id: "",
    estado_inmueble: "venta",
    montoInicial: true,
    moneda: "BS",
    precio: "",
    precio_por_mes: "",
    cantidad_meses: "",
    area_m2: "",
    area_construccion_m2: "",
    terminos_y_condiciones: "",
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
    numero_mascotas: "",
    permite_infantes: false,
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [caracteristicasErrs, setCaracteristicasErrs] = useState({});
  const fileRef = useRef(null);
  const initEdit = useRef(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const mapWrapRef = useRef(null);
  const [mapActivo, setMapActivo] = useState(true);

  const secuenciaGeocode = useRef(0);
  const debounceGeoRef = useRef(null);
  const [geoStatus, setGeoStatus] = useState("idle");
  const [geoOpciones, setGeoOpciones] = useState([]);
  const [geoElegida, setGeoElegida] = useState(0);
  const [geoError, setGeoError] = useState("");

  const reverseEscribio = useRef(false);
  const secuenciaReverse = useRef(0);
  const debounceReverseRef = useRef(null);
  const ultimasCoordsReverse = useRef(null);
  const [reverseBusy, setReverseBusy] = useState(false);

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

  function aplicarGeoResultado(r) {
    set("latitud", Number(r.latitud).toFixed(6));
    set("longitud", Number(r.longitud).toFixed(6));
    setFieldErrors((p) => ({ ...p, ubicacion: "" }));
    ultimasCoordsReverse.current = { lat: Number(r.latitud), lng: Number(r.longitud) };
  }

  function buscarNombreLugar(lat, lng) {
    const coords = { lat: Number(lat), lng: Number(lng) };
    const prev = ultimasCoordsReverse.current;
    if (prev && distanciaMetros(prev, coords) < UMBRAL_REVERSE_M) return;
    ultimasCoordsReverse.current = coords;
    clearTimeout(debounceReverseRef.current);
    setReverseBusy(true);
    debounceReverseRef.current = setTimeout(async () => {
      const miSeq = ++secuenciaReverse.current;
      try {
        const r = await apiGet("/geocoding/reverse", { lat, lng });
        if (secuenciaReverse.current !== miSeq) return;
        const d = r.data;
        const direccion = d?.direccion;
        if (direccion) {
          reverseEscribio.current = true;
          set("direccion_exacta", direccion);
          if (d?.estado_id) set("estado_id", String(d.estado_id));
          if (d?.ciudad_id) set("ciudad_id", String(d.ciudad_id));
          setGeoOpciones([]);
          setGeoStatus("idle");
        }
      } catch {
        if (secuenciaReverse.current !== miSeq) return;
      } finally {
        if (secuenciaReverse.current === miSeq) setReverseBusy(false);
      }
    }, 300);
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
      } catch { void 0; }
    })();
  }, []);

  /* ─── prellenar con datos del inmueble (modo edición) ─── */
  useEffect(() => {
    if (!edit || !inmueble || initEdit.current || !estados.length) return;
    initEdit.current = true;
    reverseEscribio.current = true;

    const estadoId = estados.find((s) => s.nombre === inmueble.estado)?.id ?? "";
    const vac = inmueble.alquiler_vacacional || {};

    setForm({
      titulo: inmueble.titulo || "",
      descripcion: inmueble.descripcion || "",
      tipo_inmueble_id: String(inmueble.tipo_inmueble_id || ""),
      estado_inmueble: inmueble.estado_inmueble || "venta",
      montoInicial: Number(inmueble.precio) > 0,
      moneda: inmueble.moneda || "BS",
      precio: inmueble.precio ?? "",
      precio_por_mes: inmueble.alquiler_fijo?.precio_mes ?? inmueble.precio_por_mes ?? "",
      cantidad_meses: inmueble.alquiler_fijo?.cantidad_meses ?? inmueble.cantidad_meses ?? "",
      area_m2: inmueble.area_m2 ?? "",
      area_construccion_m2: Number(inmueble.area_construccion_m2) > 0 ? inmueble.area_construccion_m2 : "",
      terminos_y_condiciones: inmueble.terminos_y_condiciones || "",
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
      numero_mascotas: vac.cantidad_mascotas_permitidas ?? vac.numero_mascotas ?? "",
      permite_infantes: vac.permiso_infantes ?? true,
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

    setImagenesExistentes(Array.isArray(inmueble.imagenes) ? inmueble.imagenes : []);
    setSelectedFiles([]);
    setPreviews([]);
    setCaracteristicasErrs({});
    setErr("");
    ultimasCoordsReverse.current = {
      lat: Number(inmueble.latitud || 10.4806),
      lng: Number(inmueble.longitud || -66.9036),
    };
    if (fileRef.current) fileRef.current.value = "";
  }, [edit, inmueble, estados, caracteristicasIniciales]);

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

  function agregarMascota(id) {
    if (mascotasSel.includes(Number(id))) return;
    setMascotasSel((prev) => [...prev, Number(id)]);
  }

  function quitarMascota(id) {
    setMascotasSel((prev) => prev.filter((m) => m !== Number(id)));
  }

  useEffect(() => {
    if (!form.estado_id) { setCiudades([]); return; }
    apiGet("/ciudades", { estado_id: form.estado_id })
      .then((r) => setCiudades(r.data || []))
      .catch(() => setCiudades([]));
  }, [form.estado_id]);

  useEffect(() => {
    clearTimeout(debounceGeoRef.current);
    if (reverseEscribio.current) {
      reverseEscribio.current = false;
      return;
    }
    const dir = (form.direccion_exacta || "").trim();
    if (dir.length < 4) {
      setGeoStatus("idle");
      setGeoOpciones([]);
      return;
    }
    setGeoStatus("buscando");
    debounceGeoRef.current = setTimeout(async () => {
      const miSeq = ++secuenciaGeocode.current;
      const estado = estados.find((e) => e.id === Number(form.estado_id))?.nombre;
      const ciudad = ciudades.find((c) => c.id === Number(form.ciudad_id))?.nombre;
      try {
        const r = await apiGet("/geocoding/forward", { direccion: dir, ciudad, estado });
        if (secuenciaGeocode.current !== miSeq) return;
        const resultados = r.data || [];
        if (!resultados.length) {
          setGeoStatus("sin_resultados");
          setGeoOpciones([]);
          return;
        }
        setGeoOpciones(resultados);
        setGeoElegida(0);
        aplicarGeoResultado(resultados[0]);
        setGeoStatus("ok");
      } catch (e) {
        if (secuenciaGeocode.current !== miSeq) return;
        setGeoStatus("error");
        setGeoError(e.message);
      }
    }, 500);
    return () => clearTimeout(debounceGeoRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.direccion_exacta, form.estado_id, form.ciudad_id]);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (mapWrapRef.current && !mapWrapRef.current.contains(e.target)) setMapActivo(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

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
      const la = lat.toFixed(6);
      const lo = lng.toFixed(6);
      set("latitud", la);
      set("longitud", lo);
      buscarNombreLugar(la, lo);
    });

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      const la = lat.toFixed(6);
      const lo = lng.toFixed(6);
      marker.setLatLng([la, lo]);
      set("latitud", la);
      set("longitud", lo);
      buscarNombreLugar(la, lo);
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

  const esAlquilerFijo = form.estado_inmueble === "alquiler_fijo";
  const precioOpcional =
    !form.montoInicial && (esAlquilerFijo || form.estado_inmueble === "vacacional");

  function validate() {
    const errs = {};
    if (!form.titulo?.trim()) errs.titulo = "El título es obligatorio";
    if (esAdmin && !edit && !corredorUsuarioId) errs.corredorUsuarioId = "Selecciona el corredor";
    if (!form.tipo_inmueble_id) errs.tipo_inmueble_id = "Selecciona un tipo de inmueble";
    const precioNum = Number(form.precio);
    if (
      form.precio === "" ||
      form.precio === null ||
      form.precio === undefined ||
      Number.isNaN(precioNum) ||
      precioNum < 0 ||
      (precioNum === 0 && !precioOpcional)
    ) {
      errs.precio = "Ingresa un precio válido";
    }
    if (!form.estado_id) errs.estado_id = "Selecciona un estado";
    if (!form.ciudad_id) errs.ciudad_id = "Selecciona una ciudad";

    //Área de construcción: opcional, nunca negativa, nunca mayor al área total
    if (form.area_construccion_m2 !== "" && form.area_construccion_m2 !== null && form.area_construccion_m2 !== undefined) {
      const areaConst = Number(form.area_construccion_m2);
      if (Number.isNaN(areaConst)) {
        errs.area_construccion_m2 = "Ingresa un área de construcción válida";
      } else if (areaConst < 0) {
        errs.area_construccion_m2 = "El área de construcción no puede ser menor a 0";
      } else {
        const areaTotal = Number(form.area_m2);
        if (form.area_m2 !== "" && !Number.isNaN(areaTotal) && areaConst > areaTotal) {
          errs.area_construccion_m2 = "El área de construcción no puede ser mayor al área del inmueble";
        }
      }
    }

    if (!form.direccion_exacta?.trim()) errs.direccion_exacta = "La dirección es obligatoria";
    if (!form.latitud || !form.longitud) errs.ubicacion = "Señala la ubicación en el mapa";
    if (form.estado_inmueble === "vacacional") {
      
      if (!form.precio_por_noche || Number(form.precio_por_noche) <= 0) errs.precio_por_noche = "Precio por noche requerido";

      if (!form.capacidad_personas || Number(form.capacidad_personas) <= 0) errs.capacidad_personas = "Capacidad requerida";

      //Si hay mascotas permitidas, pero el numero de mascotas permitidas es 0
      if (mascotasSel.length > 0 && Number(form.numero_mascotas) <= 0) {
        errs.numero_mascotas = "Indica cuántas mascotas se permiten para asignar las mascotas";
      }

      //Si el numero de mascotas permitidas es mayor a 0, pero no hay mascotas seleccionadas
      if (Number(form.numero_mascotas) > 0 && mascotasSel.length === 0) {
        errs.mascotas = "Selecciona las mascotas que se permiten";
      }
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

    if (edit) {
      if (!imagenesExistentes.length && !selectedFiles.length) {
        errs.imagenes = "El inmueble debe tener al menos una imagen";
      }
    } else if (!selectedFiles.length) {
      errs.imagenes = "Debes cargar al menos una imagen";
    }

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
        precio: esAlquilerFijo && !form.montoInicial ? 0 : form.precio ? Number(form.precio) : null,
        moneda: form.moneda,
        area_m2: form.area_m2 ? Number(form.area_m2) : null,
        area_construccion_m2: form.area_construccion_m2 ? Number(form.area_construccion_m2) : 0,
        terminos_y_condiciones: form.terminos_y_condiciones?.trim() || null,
        ciudad_id: form.ciudad_id ? Number(form.ciudad_id) : null,
        direccion_exacta: form.direccion_exacta || null,
        punto_referencia: form.punto_referencia || null,
        usuario_id: esAdmin ? Number(corredorUsuarioId) : user?.id ? Number(user.id) : null,
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
        payload.mascotas = mascotasSel.map((id) => ({ mascota_id: id }));
        payload.permiso_infantes = form.permite_infantes;
        payload.cantidad_mascotas_permitidas = form.numero_mascotas ? Number(form.numero_mascotas) : 0;
      }

      if (form.estado_inmueble === "alquiler_fijo") {
        payload.precio_por_mes = form.precio_por_mes ? Number(form.precio_por_mes) : null;
        payload.cantidad_meses = form.cantidad_meses ? Number(form.cantidad_meses) : null;
      }

      if (edit) {
        const imagenesOriginales = Array.isArray(inmueble?.imagenes) ? inmueble.imagenes : [];
        const idsEliminadas = imagenesOriginales
          .map((img) => img.id)
          .filter((imgId) => !imagenesExistentes.some((img) => img.id === imgId));
        if (idsEliminadas.length) payload.borrar_imagenes = idsEliminadas;
      }

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      selectedFiles.forEach((it) => fd.append("imagenes", it.file));

      if (edit) {
        await apiUpload(`/inmuebles/${inmueble?.id}`, fd, "PUT");
        await onSaved?.();
      } else {
        await apiUpload("/inmuebles", fd);
        navigate("/inmuebles");
      }
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
    <>
      <ErrorMessage message={err} onClose={() => setErr("")} />

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className={labelCls}>Título *</label>
          <input className={`${inputCls} ${fieldErrors.titulo ? inputClsErr : ""}`} value={form.titulo} onChange={(e) => { set("titulo", e.target.value); setFieldErrors((p) => ({ ...p, titulo: "" })); }} placeholder="Ej: Apartamento en Bella Vista" />
          {fieldErrors.titulo && <p className={errMsgCls}>{fieldErrors.titulo}</p>}
        </div>

        <div>
          <label className={labelCls}>Descripción</label>
          <textarea className={inputCls + " min-h-[80px]"} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Descripción del inmueble" />
        </div>

        <div>
          <label className={labelCls}>Términos y condiciones</label>
          <textarea
            className={inputCls + " min-h-[80px]"}
            value={form.terminos_y_condiciones}
            onChange={(e) => set("terminos_y_condiciones", e.target.value)}
            placeholder="Condiciones de alquiler, compra, uso, penalidades…"
          />
        </div>

        {esAdmin && !edit ? (
          <div>
            <label className={labelCls}>Corredor *</label>
            <select
              className={`${inputCls} ${fieldErrors.corredorUsuarioId ? inputClsErr : ""}`}
              value={corredorUsuarioId}
              onChange={(e) => {
                setCorredorUsuarioId(e.target.value);
                setFieldErrors((p) => ({ ...p, corredorUsuarioId: "" }));
              }}
            >
              <option value="">Seleccionar corredor…</option>
              {corredores.map((c) => (
                <option key={c.corredor_id || c.id} value={c.id}>
                  {c.corredor_nombre || c.nombre || c.corredor_email || c.email}
                </option>
              ))}
            </select>
            {fieldErrors.corredorUsuarioId ? <p className={errMsgCls}>{fieldErrors.corredorUsuarioId}</p> : null}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls}>Tipo de inmueble *</label>
            <select className={`${inputCls} ${fieldErrors.tipo_inmueble_id ? inputClsErr : ""}`} value={form.tipo_inmueble_id} onChange={(e) => { set("tipo_inmueble_id", e.target.value); setFieldErrors((p) => ({ ...p, tipo_inmueble_id: "" })); }}>
              <option value="">Seleccionar…</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            {fieldErrors.tipo_inmueble_id && <p className={errMsgCls}>{fieldErrors.tipo_inmueble_id}</p>}
          </div>
          {!edit && (
            <div>
              <label className={labelCls}>Operación *</label>
              <select className={inputCls} value={form.estado_inmueble} onChange={(e) => {
                const op = e.target.value;
                set("estado_inmueble", op);
                if (op === "alquiler_fijo") {
                  set("montoInicial", false);
                  set("precio", "0");
                }
              }}>
                <option value="venta">Venta</option>
                <option value="alquiler_fijo">Alquiler fijo</option>
                <option value="vacacional">Vacacional</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className={form.estado_inmueble === "vacacional" || esAlquilerFijo ? "md:col-span-4" : ""}>
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
            {esAlquilerFijo && (
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
                  ¿Se cobrará un mes administrativo?
                </span>
              </label>
            )}
            {!form.montoInicial && (form.estado_inmueble === "vacacional" || esAlquilerFijo) ? null : (
              <>
                <label className={labelCls}>{form.estado_inmueble === "vacacional" ? "Monto Inicial" : esAlquilerFijo ? "Precio del mes administrativo" : "Precio"}{!precioOpcional && " *"}</label>
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
            <input className={inputCls} type="number" min="0" value={form.area_m2} onChange={(e) => set("area_m2", e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className={labelCls}>Área de construcción (m²)</label>
            <input
              className={`${inputCls} ${fieldErrors.area_construccion_m2 ? inputClsErr : ""}`}
              type="number"
              min="0"
              value={form.area_construccion_m2}
              onChange={(e) => { set("area_construccion_m2", e.target.value); setFieldErrors((p) => ({ ...p, area_construccion_m2: "" })); }}
              placeholder="0"
            />
            {fieldErrors.area_construccion_m2 && <p className={errMsgCls}>{fieldErrors.area_construccion_m2}</p>}
          </div>
        </div>

        {form.estado_inmueble === "alquiler_fijo" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Precio por mes</label>
              <input className={inputCls} type="number" min="0" value={form.precio_por_mes} onChange={(e) => set("precio_por_mes", e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Cantidad de meses</label>
              <input className={inputCls} type="number" min="1" value={form.cantidad_meses} onChange={(e) => set("cantidad_meses", e.target.value)} placeholder="0" />
            </div>
          </div>
        )}

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
                <label className={labelCls}>Número de mascotas permitidas</label>
                <input className={`${inputCls} mt-1 ${fieldErrors.numero_mascotas ? inputClsErr : ""}`} type="number" min="1" value={form.numero_mascotas} onChange={(e) => { set("numero_mascotas", e.target.value); setFieldErrors((p) => ({ ...p, numero_mascotas: "" })); }} placeholder="0" />
                {fieldErrors.numero_mascotas && <p className={errMsgCls}>{fieldErrors.numero_mascotas}</p>}

                <label className={labelCls + " block mt-4"}>Mascotas permitidas</label>
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
                      const mascota =
                        mascotasDisponibles.find((m) => m.id === mascotaId) ||
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
                    const costo =
                      costosDisponibles.find((c) => c.id === cs.costo_adicional_id) ||
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
            <div className="flex items-baseline justify-between">
              <label className={labelCls}>Dirección exacta *</label>
              <span className="text-[11px] text-slate-400">País: Venezuela</span>
            </div>
            <textarea className={`${inputCls} ${fieldErrors.direccion_exacta ? inputClsErr : ""} min-h-[60px]`} value={form.direccion_exacta} onChange={(e) => { set("direccion_exacta", e.target.value); setFieldErrors((p) => ({ ...p, direccion_exacta: "" })); }} placeholder="Calle, avenida, número, edificio, apto…" />
            {fieldErrors.direccion_exacta && <p className={errMsgCls}>{fieldErrors.direccion_exacta}</p>}
            {geoStatus === "buscando" && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-900 border-t-transparent dark:border-purple-400" />
                Buscando la ubicación en el mapa…
              </p>
            )}
            {geoStatus === "ok" && (
              <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Ubicación encontrada, el marcador se movió en el mapa.
              </p>
            )}
            {geoStatus === "sin_resultados" && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                No se encontró esa dirección. Señálala manualmente en el mapa.
              </p>
            )}
            {geoStatus === "error" && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{geoError}</p>
            )}
            {geoOpciones.length > 1 && (
              <div className="mt-2">
                <label className={labelCls}>¿La dirección coincide con alguna de estas?</label>
                <select className={inputCls + " mt-1"} value={geoElegida} onChange={(e) => {
                  const idx = Number(e.target.value);
                  setGeoElegida(idx);
                  aplicarGeoResultado(geoOpciones[idx]);
                }}>
                  {geoOpciones.map((o, i) => (
                    <option key={o.place_id || i} value={i}>{o.formatted_address}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className={labelCls}>Punto de referencia</label>
            <input className={inputCls} value={form.punto_referencia} onChange={(e) => set("punto_referencia", e.target.value)} placeholder="Ej: Cerca del centro comercial" />
          </div>

          {/* Map */}
          <div className="mt-4">
            <label className={labelCls}>Ubicación en el mapa</label>
            <p className="text-xs text-slate-400 mt-0.5 mb-2">Haz clic en el mapa o arrastra el marcador para señalar la ubicación exacta.</p>
            <div ref={mapWrapRef} className="relative h-64 sm:h-72 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600" style={{ isolation: "isolate" }}>
              <div ref={mapRef} className="h-full w-full" />
              {!mapActivo && (
                <button
                  type="button"
                  onClick={() => setMapActivo(true)}
                  title="Haz clic para activar el mapa"
                  className="absolute inset-0 z-[1001] flex items-end justify-center bg-transparent pb-3 cursor-pointer"
                >
                  <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white shadow-lg">
                    Haz clic para activar el mapa…
                  </span>
                </button>
              )}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>Latitud: {form.latitud || "-"}</span>
              <span>Longitud: {form.longitud || "-"}</span>
              {reverseBusy && <span className="text-purple-700 dark:text-purple-400">Detectando dirección…</span>}
            </div>
            {fieldErrors.ubicacion && <p className={errMsgCls}>{fieldErrors.ubicacion}</p>}
          </div>
        </fieldset>

        <div>
          <label className={labelCls}>Imágenes</label>

          {edit && imagenesExistentes.length > 0 && (
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
                      onClick={() => {
                        setImagenesExistentes((p) => p.filter((x) => x.id !== img.id));
                        setFieldErrors((p) => ({ ...p, imagenes: "" }));
                      }}
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
          <button type="button" className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer" onClick={() => (edit ? onCancel?.() : navigate("/inmuebles"))}>
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? "Guardando…" : edit ? "Guardar cambios" : "Crear inmueble"}
          </button>
        </div>
      </form>
    </>
  );
}