import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/useAuth";
import { readLang, writeLang } from "../lib/i18n";

export const DEFAULT_SETTINGS = {
  // ── 1. Visualización y Sistema ──
  tema: "auto", // "light" | "dark" | "auto"
  idioma: "es", // "es" | "en"
  moneda: "USD", // "USD" | "VES" | "EUR"
  unidadSuperficie: "m2", // "m2" | "sqft" | "ha"
  formatoNumero: "coma_decimal", // "punto_decimal" (1,234.56) | "coma_decimal" (1.234,56)
  
  // ── 2. Preferencias Inmobiliarias & Búsqueda ──
  operacionPorDefecto: "todas", // "todas" | "venta" | "alquiler" | "vacacional"
  tipoInmuebleFavorito: "",
  estadoInteresId: "",
  presupuestoMin: "",
  presupuestoMax: "",
  soloPetFriendly: false,
  vistaInmuebles: "grid", // "grid" | "list"
  inmueblesPorPagina: 12, // 12 | 24 | 48
  
  // ── 3. Notificaciones y Alertas ──
  notifNuevosInmuebles: true,
  notifBajaPrecio: true,
  notifCambioEstatus: true,
  notifVencimientoRenta: true,
  notifRecibosPagos: true,
  canalInApp: true,
  canalEmail: true,
  canalWhatsApp: false,
  frecuenciaEmail: "inmediato", // "inmediato" | "diario" | "semanal"

  // ── 4. Privacidad y Contacto ──
  mostrarTelefono: true,
  botonWhatsAppDirecto: true,
  mostrarEmailPublico: false,
  perfilIndexable: true,

  // ── 5. Gestión Inmobiliaria / Negocio (Corredores y Administradores) ──
  tasaReferencia: "bcv", // "bcv" | "paralelo" | "manual"
  tasaManualValor: "",
  comisionVentaPct: 5.0,
  comisionAlquilerTipo: "1_mes", // "1_mes" | "porcentaje"
  comisionAlquilerPct: 10.0,
  diasGraciaRenta: 5,
  plantillaMensajeWhatsApp:
    "¡Hola! Vi tu interés en el inmueble publicado en Saphiro Inmobiliaria. ¿Te gustaría agendar una visita o consultar detalles adicionales?",
  metodosPagoAceptados: {
    pagoMovil: true,
    transferenciaNacional: true,
    zelle: true,
    binanceUsdt: false,
    efectivo: true,
  },

  // ── 6. Seguridad ──
  dosFactoresHabilitado: false,
};

function getStorageKey(user) {
  if (user?.uuid) return `saphiro_settings_${user.uuid}`;
  if (user?.id) return `saphiro_settings_u${user.id}`;
  return "saphiro_settings_guest";
}

function applyTheme(themeValue) {
  let isDark = false;
  if (themeValue === "dark") {
    isDark = true;
  } else if (themeValue === "light") {
    isDark = false;
  } else {
    // "auto": según preferencia del sistema
    isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

export function useSettings() {
  const { user } = useAuth();
  const storageKey = useMemo(() => getStorageKey(user), [user]);

  // Cargar configuración inicial
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : {};
      
      // Obtener el idioma actual de i18n
      const currentLang = readLang();
      // Obtener el tema actual guardado
      const savedTheme = localStorage.getItem("theme");
      const defaultTheme = savedTheme === "dark" ? "dark" : savedTheme === "light" ? "light" : "auto";

      return {
        ...DEFAULT_SETTINGS,
        tema: defaultTheme,
        idioma: currentLang || DEFAULT_SETTINGS.idioma,
        ...parsed,
        metodosPagoAceptados: {
          ...DEFAULT_SETTINGS.metodosPagoAceptados,
          ...(parsed.metodosPagoAceptados || {}),
        },
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Guardar en localStorage cuando cambie settings
  const persistSettings = useCallback((newSettings) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newSettings));
    } catch (e) {
      console.warn("No se pudo guardar la configuración en localStorage:", e);
    }
  }, [storageKey]);

  // Sincronizar tema e idioma cuando cambian en settings
  useEffect(() => {
    if (settings.tema) {
      applyTheme(settings.tema);
    }
  }, [settings.tema]);

  useEffect(() => {
    if (settings.idioma && settings.idioma !== readLang()) {
      writeLang(settings.idioma);
      window.dispatchEvent(new Event("saphiro-lang"));
    }
  }, [settings.idioma]);

  // Manejar listener para cambios del sistema operativo si tema === "auto"
  useEffect(() => {
    if (settings.tema !== "auto") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      document.documentElement.classList.toggle("dark", e.matches);
      localStorage.setItem("theme", e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener?.("change", handler);
    return () => mediaQuery.removeEventListener?.("change", handler);
  }, [settings.tema]);

  // Actualizar un valor puntual
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  // Actualizar múltiples valores a la vez
  const updateSettings = useCallback((partial) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  // Restablecer valores
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    persistSettings(DEFAULT_SETTINGS);
    applyTheme(DEFAULT_SETTINGS.tema);
    writeLang(DEFAULT_SETTINGS.idioma);
    window.dispatchEvent(new Event("saphiro-lang"));
  }, [persistSettings]);

  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    DEFAULT_SETTINGS,
  };
}

