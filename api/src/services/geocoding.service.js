const AppError = require("../utils/AppError");
const pool = require("../db/pool");

const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const REQUEST_TIMEOUT_MS = 8000;

const cache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function buildUrl(params) {
  const url = new URL(GOOGLE_GEOCODE_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  return url.toString();
}

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.t > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.v;
}

function cacheSet(key, value) {
  if (cache.size > 2000) cache.clear();
  cache.set(key, { t: Date.now(), v: value });
}

function throwForStatus(status, errorMessage) {
  if (status === "OK") return;
  switch (status) {
    case "ZERO_RESULTS":
      return null;
    case "OVER_QUERY_LIMIT":
      throw new AppError("Se agotó la cuota del servicio de geocodificación", 429);
    case "REQUEST_DENIED":
      throw new AppError("El servicio de geocodificación no está habilitado o la API key es inválida", 503);
    case "INVALID_REQUEST":
      throw new AppError("Solicitud de geocodificación inválida", 400);
    case "UNKNOWN_ERROR":
      throw new AppError("Error desconocido del servicio de geocodificación", 502);
    default:
      throw new AppError(errorMessage, 502);
  }
}

async function geocodeJson(url) {
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      throw new AppError("Tiempo agotado consultando el servicio de geocodificación", 504);
    }
    throw new AppError("No se pudo contactar el servicio de geocodificación", 502);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new AppError("Respuesta inválida del servicio de geocodificación", 502);
  }

  const mapped = throwForStatus(data.status, "El servicio de geocodificación respondió con un error");
  return { mapped, data };
}

function normalizeComponentes(components) {
  const pick = (types) => {
    const c = components.find((comp) => types.some((t) => comp.types.includes(t)));
    return c ? c.long_name : undefined;
  };
  return {
    numero: pick(["street_number"]),
    calle: pick(["route"]),
    ciudad: pick(["locality", "sublocality_level_1", "administrative_area_level_2"]),
    estado: pick(["administrative_area_level_1"]),
    pais: pick(["country"]),
    codigo_postal: pick(["postal_code"]),
  };
}

const TIPOS_ADMIN = [
  "country",
  "administrative_area_level_1",
  "administrative_area_level_2",
  "locality",
  "postal_code",
  "postal_code_suffix",
  "plus_code",
];

/**
 * Construye el texto de dirección (avenida/calle + número) desde formatted_address,
 * quitando ciudad/estado/país/código postal/plus_code. Conserva el prefijo de vía
 * ("Avenida Andrés Bello") aunque el componente `route` venga sin él.
 */
function textoDireccion(formattedAddress, components) {
  const quitar = components
    .filter((c) => c.types.some((t) => TIPOS_ADMIN.includes(t)))
    .map((c) => c.long_name.toLowerCase());

  const esPlusCode = (p) => /^[0-9A-Z]{4}\+[0-9A-Z]{2,}/i.test(p);

  const partes = String(formattedAddress || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => {
      if (esPlusCode(p)) return false;
      const low = p.toLowerCase();
      return !quitar.some((q) => q && (low === q || low.startsWith(q + " ") || low.endsWith(" " + q)));
    });

  if (partes.length) return partes.join(", ");

  // Fallback: armar desde los componentes si el formatted_address quedó vacío.
  const first = (types) => {
    const c = components.find((comp) => types.some((t) => comp.types.includes(t)));
    return c ? c.long_name : undefined;
  };
  const premisa = first(["premise", "establishment"]);
  const numero = first(["street_number"]);
  const calle = first(["route"]);
  const armado = [];
  if (premisa) armado.push(premisa);
  if (numero && calle) armado.push(`${numero} ${calle}`);
  else if (calle) armado.push(calle);
  if (armado.length) return armado.join(", ");

  const cruce = first(["intersection"]);
  if (cruce) return cruce;
  const lugar = first(["neighborhood", "sublocality_level_1"]);
  if (lugar) return lugar;
  return formattedAddress;
}

const TIPOS_VIA = /^(avenida|av\.?|calle|c\.?|carrera|carretera|autopista|boulevard|blvd\.?|callej[oó]n|pasaje|transversal|diagonal|paseo|esquina|sector|urbanizaci[oó]n|manzana|vereda|trocha|prolongaci[oó]n)\b/i;

/**
 * Asegura que el nombre de la vía tenga su tipo ("Avenida"/"Calle") si le falta.
 */
function formatearVia(nombre, tipo) {
  if (!nombre) return null;
  const n = String(nombre).trim();
  if (!n) return null;
  return TIPOS_VIA.test(n) ? n : tipo ? `${tipo} ${n}` : n;
}

/**
 * Detecta un cruce del tipo "Avenida X con Calle Y" en los componentes.
 */
function interseccionDe(components) {
  const num = components.find((c) => c.types.includes("street_number"));
  const route = components.find((c) => c.types.includes("route"));
  if (!num || !route) return null;
  const m = num.long_name.match(/^(.*?)\s+con\s*$/i);
  if (!m) return null;
  const avenida = m[1].trim();
  const calle = route.long_name.trim();
  if (!avenida || !calle) return null;
  return { avenida, calle };
}

const DESPLAZAMIENTO_M = 25;
const norm = (s) => (s ? String(s).toLowerCase().replace(/[^a-z0-9]/g, "") : "");

function offsetsDe(lat, lng) {
  const dLat = DESPLAZAMIENTO_M / 111320;
  const dLng = DESPLAZAMIENTO_M / (111320 * Math.cos((lat * Math.PI) / 180));
  return [
    { lat: lat + dLat, lng },
    { lat: lat - dLat, lng },
    { lat, lng: lng + dLng },
    { lat, lng: lng - dLng },
  ];
}

/**
 * Devuelve la primera vía (route) que Google asocia al punto, o null.
 * Tolerante a errores: cualquier fallo devuelve null.
 */
async function rutaEnPunto(lat, lng) {
  try {
    const { data } = await geocodeJson(
      buildUrl({
        latlng: `${lat},${lng}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
        language: "es",
        region: "ve",
      })
    );
    const venezolanos = (data.results || []).filter((r) =>
      r.address_components.some(
        (c) => c.types.includes("country") && c.long_name.toLowerCase() === "venezuela"
      )
    );
    const fr = venezolanos.find((r) => r.address_components.some((c) => c.types.includes("route")));
    const ruta = fr?.address_components.find((c) => c.types.includes("route"));
    return ruta?.long_name || null;
  } catch {
    return null;
  }
}

/**
 * Busca la calle transversal de un cruce sondeando Google en 4 micro-desplazamientos
 * (N/S/E/O). Devuelve la vía distinta a la principal, formateada, o null.
 */
async function calleCruceDe(lat, lng, rutaPrincipal) {
  const np = norm(rutaPrincipal);
  if (!np) return null;
  const rutas = await Promise.all(offsetsDe(lat, lng).map((o) => rutaEnPunto(o.lat, o.lng)));
  const unicas = [...new Set(rutas.filter(Boolean))].filter((name) => {
    const n = norm(name);
    return n && n !== np && !n.includes(np) && !np.includes(n);
  });
  if (!unicas.length) return null;
  return formatearVia(unicas[0], "Calle");
}

/**
 * Busca el id de estado y ciudad en la DB por nombre devuelto por Google.
 */
async function buscarIdsGeo(estadoNombre, ciudadNombre) {
  let estado_id = null;
  let ciudad_id = null;

  if (estadoNombre) {
    const { rows } = await pool.query(
      `SELECT id FROM estados WHERE LOWER(TRIM(nombre)) = LOWER($1) LIMIT 1;`,
      [estadoNombre]
    );
    if (rows.length) estado_id = rows[0].id;
  }

  if (ciudadNombre && estado_id) {
    const { rows } = await pool.query(
      `SELECT id FROM ciudades WHERE estado_id = $1 AND LOWER(TRIM(nombre)) = LOWER($2) LIMIT 1;`,
      [estado_id, ciudadNombre]
    );
    if (rows.length) ciudad_id = rows[0].id;
  }

  return { estado_id, ciudad_id };
}

/**
 * Geocodifica una dirección (calles/avenidas) contra Google Maps.
 * @param {object} input
 * @param {string} input.direccion  Dirección exacta (calle, avenida, número, esquina...)
 * @param {string} [input.ciudad]   Opcional, mejora precisión
 * @param {string} [input.estado]   Opcional, mejora precisión
 * @param {string} [input.pais]     Default "Venezuela"
 * @param {number} [input.limit]    Máx. resultados a devolver (default 5)
 */
exports.forwardGeocode = async ({ direccion, ciudad, estado, pais = "Venezuela", limit = 5 }) => {
  if (!direccion || !String(direccion).trim()) throw new AppError("La dirección es requerida", 400);

  const parts = [direccion.trim(), ciudad?.trim(), estado?.trim(), pais?.trim()].filter(Boolean);
  const address = parts.join(", ");

  const cacheKey = `geo:${address.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const url = buildUrl({
    address,
    key: process.env.GOOGLE_MAPS_API_KEY,
    region: "ve",
    components: "country:VE",
    language: "es",
  });

  const { mapped, data } = await geocodeJson(url);
  if (mapped === null) return [];

  const results = (data.results || []).slice(0, limit).map(({ geometry, formatted_address, place_id }) => ({
    formatted_address,
    place_id,
    latitud: geometry.location.lat,
    longitud: geometry.location.lng,
  }));

  cacheSet(cacheKey, results);
  return results;
};

/**
 * Geocodificación inversa: lat/lng → calle/avenida (solo Venezuela).
 * Devuelve la dirección como texto y el estado/ciudad como id de la DB.
 * @param {number} lat
 * @param {number} lng
 */
exports.reverseGeocode = async ({ lat, lng }) => {
  if (lat === undefined || lng === undefined) throw new AppError("lat y lng son requeridos", 400);

  const cacheKey = `geo_rev:${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const paramsBase = {
    latlng: `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`,
    key: process.env.GOOGLE_MAPS_API_KEY,
    language: "es",
    region: "ve",
  };

  // Sin result_type: se usa el ranking natural de Google (el primer resultado es el más cercano).
  const { mapped, data } = await geocodeJson(buildUrl(paramsBase));

  if (mapped === null) {
    const err = new AppError("No se encontró dirección para esas coordenadas", 404);
    err.code = "ZERO_RESULTS";
    throw err;
  }

  // Solo resultados dentro de Venezuela (el reverse es global).
  const venezolanos = data.results.filter(
    (r) => r.address_components.some((c) => c.types.includes("country") &&
      c.long_name.toLowerCase() === "venezuela")
  );

  if (!venezolanos.length) {
    const err = new AppError("Solo se permiten ubicaciones dentro de Venezuela", 404);
    err.code = "ZERO_RESULTS";
    throw err;
  }

  // Google ordena por cercanía/relevancia: usa la primera vía (route) real del pin.
  const conVia = (r) => r.address_components.some((c) => c.types.includes("route"));
  const result = venezolanos.find(conVia) || venezolanos[0];
  const componentes = normalizeComponentes(result.address_components);

  const { estado_id, ciudad_id } = await buscarIdsGeo(componentes.estado, componentes.ciudad);

  // Dirección en formato "avenida X, calle Y".
  const routeBest = result.address_components.find((c) => c.types.includes("route"))?.long_name;
  const interseccion = venezolanos
    .map((r) => interseccionDe(r.address_components))
    .find(
      (it) =>
        it &&
        (!routeBest ||
          norm(it.avenida) === norm(routeBest) ||
          norm(it.avenida).includes(norm(routeBest)) ||
          norm(routeBest).includes(norm(it.avenida)))
    );

  let direccion;
  if (interseccion) {
    direccion = `${formatearVia(interseccion.avenida, "Avenida")}, ${formatearVia(interseccion.calle, "Calle")}`;
  } else if (routeBest) {
    // Sin cruce explícito: sondea la calle transversal con micro-desplazamientos.
    const calle = await calleCruceDe(Number(lat), Number(lng), routeBest);
    direccion = calle
      ? `${formatearVia(routeBest, null)}, ${calle}`
      : formatearVia(routeBest, null);
  } else {
    direccion =
      formatearVia(routeBest, null) || textoDireccion(result.formatted_address, result.address_components);
  }

  const out = {
    direccion,
    estado_id,
    ciudad_id,
    latitud: result.geometry.location.lat,
    longitud: result.geometry.location.lng,
  };

  cacheSet(cacheKey, out);
  return out;
};