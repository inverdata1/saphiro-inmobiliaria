import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api";
import { useAuth } from "../context/AuthContext";
import PropertyCard from "../components/PropertyCard";
import ErrorBanner from "../components/ErrorBanner";

function MenuCard({ to, icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</div>
        <div className="text-xl">{icon}</div>
      </div>
      <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</div>
      <div className="mt-4 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700">Ir →</div>
    </Link>
  );
}

const MOCK_LATEST = [
  { id: 1, titulo: "Penthouse de Lujo en Piantini", tipo_inmueble: "Penthouse", estado_inmueble: "venta", estatus: "disponible", precio: 18500000, habitaciones: 4, banos: 3, area_m2: 320, sector: "Piantini", ciudad: "Santo Domingo", imagen_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" },
  { id: 2, titulo: "Apartamento en Bella Vista", tipo_inmueble: "Apartamento", estado_inmueble: "alquiler_fijo", estatus: "disponible", precio: 45000, habitaciones: 2, banos: 2, area_m2: 110, sector: "Bella Vista", ciudad: "Santo Domingo", imagen_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" },
  { id: 3, titulo: "Villa de Playa en Juan Dolio", tipo_inmueble: "Villa", estado_inmueble: "vacacional", estatus: "disponible", precio: 8500, habitaciones: 3, banos: 2, area_m2: 200, sector: "Juan Dolio", ciudad: "San Pedro de Macorís", imagen_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80" },
  { id: 4, titulo: "Casa en Arroyo Hondo", tipo_inmueble: "Casa", estado_inmueble: "venta", estatus: "vendido", precio: 9200000, habitaciones: 4, banos: 3, area_m2: 280, sector: "Arroyo Hondo", ciudad: "Santo Domingo", imagen_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" },
  { id: 5, titulo: "Ático en Naco", tipo_inmueble: "Ático", estado_inmueble: "venta", estatus: "reservado", precio: 22000000, habitaciones: 3, banos: 3, area_m2: 250, sector: "Naco", ciudad: "Santo Domingo", imagen_url: "https://images.unsplash.com/photo-1600585153490-76fb20a32601?auto=format&fit=crop&w=800&q=80" },
  { id: 6, titulo: "Casa de Campo en Jarabacoa", tipo_inmueble: "Casa", estado_inmueble: "vacacional", estatus: "disponible", precio: 12000, habitaciones: 3, banos: 2, area_m2: 180, sector: "Jarabacoa", ciudad: "La Vega", imagen_url: "https://images.unsplash.com/photo-1600566753086-00f18f6b6012?auto=format&fit=crop&w=800&q=80" },
];

export default function DashboardPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const { user } = useAuth();
  const [latestInmuebles, setLatestInmuebles] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/inmuebles", { limit: 6 });
        const data = res?.data ?? [];
        setLatestInmuebles(Array.isArray(data) ? data : []);
      } catch {
        setLatestInmuebles(MOCK_LATEST);
      }
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Panel de inmuebles</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Explora y revisa los últimos inmuebles del sistema.</p>
        </div>

      </div>

      <ErrorBanner message={err} onClose={() => setErr("")} />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MenuCard
          to="/inmuebles"
          icon="🏠"
          title="Inmuebles"
          subtitle="Busca, filtra y crea nuevos inmuebles."
        />
        <MenuCard
          to="/transacciones"
          icon="📑"
          title="Transacciones"
          subtitle="Revisa ventas, compras y alquileres."
        />
        <MenuCard
          to="/comisiones"
          icon="💰"
          title="Comisiones"
          subtitle="Consulta comisiones por corredor."
        />
        <MenuCard
          to="/bitacora"
          icon="🧠"
          title="Bitacora"
          subtitle="Auditoría y estadísticas del sistema."
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="text-lg font-semibold dark:text-slate-100">Buscar por categoría</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/inmuebles?q=villa" className="btn-secondary">
            Villas
          </Link>
          <Link to="/inmuebles?q=apartamento" className="btn-secondary">
            Apartamentos
          </Link>
          <Link to="/inmuebles?estado_inmueble=alquiler_fijo" className="btn-secondary">
            Alquiler
          </Link>
          <Link to="/inmuebles?estado_inmueble=vacacional" className="btn-secondary">
            Vacaciones
          </Link>
          <Link to="/inmuebles?q=airbnb" className="btn-secondary">
            Airbnb
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold dark:text-slate-100">Últimos inmuebles</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Los más recientes agregados.</div>
            </div>
            <Link to="/inmuebles" className="text-sm underline">
              Ver todos
            </Link>
          </div>

          {latestInmuebles.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {latestInmuebles.map((i) => (
                <PropertyCard key={i.id || i.inmueble_id} property={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Aún no hay inmuebles registrados.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border rounded-2xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="font-bold mb-3 dark:text-slate-100">Tu perfil</div>
            {user ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Nombre:</span> {user.nombre || user.name || "—"}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {user.email || "—"}
                </div>
                {user.cargo ? (
                  <div>
                    <span className="font-semibold">Cargo:</span> {user.cargo}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">No se pudo cargar la información de usuario.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
