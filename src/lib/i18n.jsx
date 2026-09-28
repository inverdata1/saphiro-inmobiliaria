import { useEffect, useState } from "react";

export const LANG_KEY = "saphiro-lang";

const COPY = {
  es: {
    home: "Inicio",
    properties: "Inmuebles",
    saved: "Guardados",
    dashboard: "Dashboard",
    transactions: "Transacciones",
    brokers: "Corredores",
    admins: "Administradores",
    commissions: "Comisiones",
    log: "Bitácora",
    signIn: "Iniciar sesión",
    signOut: "Cerrar sesión",
    light: "Modo claro",
    dark: "Modo oscuro",
    heroTitle: "Encontrar tu próximo hogar es simple",
    heroSub:
      "Listados de venta y alquiler con fotos grandes, filtros reales y una búsqueda que no se queda tapada.",
    cityPh: "Ciudad, sector o dirección",
    type: "Tipo de inmueble",
    sale: "Venta",
    rent: "Alquiler",
    vacation: "Vacacional",
    state: "Estado",
    price: "Precio",
    search: "Buscar",
    mostViewed: "Más vistas",
    mostViewedSub: "Las propiedades que la gente está revisando ahora.",
    seeAll: "Ver todas",
    staff: "Accesos internos",
    createProperty: "Crear inmueble",
    searchTitle: "Buscar inmuebles",
    searchSub: "Explora las propiedades disponibles.",
    clear: "Limpiar",
    filters: "Filtros",
    operation: "Operación",
    allF: "Todas",
    allM: "Todos",
    status: "Estatus",
    available: "Disponible",
    reserved: "Reservado",
    sold: "Vendido",
    rented: "Alquilado",
    minPrice: "Precio mínimo",
    maxPrice: "Precio máximo",
    view: "Vista",
    list: "Listado",
    map: "Mapa",
    sort: "Ordenar",
    newest: "Más recientes",
    priceAsc: "Precio: menor a mayor",
    priceDesc: "Precio: mayor a menor",
    loading: "Cargando…",
    found: "propiedades encontradas",
    refine: "Refina tu búsqueda con los filtros.",
    empty: "No se encontraron inmuebles. Intenta cambiar los filtros.",
    loginSub: "Ingresa tus credenciales para acceder",
    email: "Correo electrónico",
    password: "Contraseña",
    enter: "Entrar",
    priceTo: "Hasta $1,500",
    priceMid: "$1,500 – $3,500",
    priceHigh: "$3,500 – $7,000",
    priceMore: "Más de $7,000",
    month: "/ mes",
  },
  en: {
    home: "Home",
    properties: "Listings",
    saved: "Saved",
    dashboard: "Dashboard",
    transactions: "Transactions",
    brokers: "Agents",
    admins: "Administrators",
    commissions: "Commissions",
    log: "Activity log",
    signIn: "Sign in",
    signOut: "Sign out",
    light: "Light mode",
    dark: "Dark mode",
    heroTitle: "Finding your next home is simple",
    heroSub: "Sale and rental listings with large photos and search that stays on top of the results.",
    cityPh: "City, neighborhood or address",
    type: "Property type",
    sale: "For sale",
    rent: "For rent",
    vacation: "Vacation",
    state: "State",
    price: "Price",
    search: "Search",
    mostViewed: "Most viewed",
    mostViewedSub: "Properties people are looking at right now.",
    seeAll: "See all",
    staff: "Staff shortcuts",
    createProperty: "Add listing",
    searchTitle: "Search listings",
    searchSub: "Browse available properties.",
    clear: "Clear",
    filters: "Filters",
    operation: "Listing type",
    allF: "All",
    allM: "All",
    status: "Status",
    available: "Available",
    reserved: "Reserved",
    sold: "Sold",
    rented: "Rented",
    minPrice: "Min price",
    maxPrice: "Max price",
    view: "View",
    list: "List",
    map: "Map",
    sort: "Sort",
    newest: "Newest",
    priceAsc: "Price: low to high",
    priceDesc: "Price: high to low",
    loading: "Loading…",
    found: "properties found",
    refine: "Refine your search with the filters.",
    empty: "No listings found. Try different filters.",
    loginSub: "Enter your credentials to continue",
    email: "Email",
    password: "Password",
    enter: "Enter",
    priceTo: "Up to $1,500",
    priceMid: "$1,500 – $3,500",
    priceHigh: "$3,500 – $7,000",
    priceMore: "Over $7,000",
    month: "/ month",
  },
};

export function readLang() {
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

export function writeLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

export function t(lang, key) {
  return COPY[lang]?.[key] || COPY.es[key] || key;
}

export function LanguageToggle() {
  const [lang, setLang] = useState("es");

  useEffect(() => {
    const next = readLang();
    setLang(next);
    writeLang(next);
  }, []);

  return (
    <button
      type="button"
      className="lang-switch"
      aria-label="Language"
      title={lang === "es" ? "English" : "Español"}
      onClick={() => {
        const next = lang === "es" ? "en" : "es";
        writeLang(next);
        setLang(next);
        window.dispatchEvent(new Event("saphiro-lang"));
      }}
    >
      <span className={lang === "es" ? "is-on" : undefined}>ES</span>
      <span className={lang === "en" ? "is-on" : undefined}>EN</span>
    </button>
  );
}

export function useLang() {
  const [lang, setLang] = useState("es");
  useEffect(() => {
    setLang(readLang());
    const onChange = () => setLang(readLang());
    window.addEventListener("saphiro-lang", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("saphiro-lang", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return lang;
}

export function useT() {
  const lang = useLang();
  return (key) => t(lang, key);
}
