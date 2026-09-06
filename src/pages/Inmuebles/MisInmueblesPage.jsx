import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../api";
import { useAuth } from "../../context/AuthContext";
import PropertyCard from "../../components/PropertyCard";

export default function MisInmueblesPage() {
  const { user } = useAuth();
  const [inmuebles, setInmuebles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const r = await apiGet(`/inmuebles/corredor/${user.id}`);
        setInmuebles(Array.isArray(r?.data) ? r.data : []);
      } catch {
        setInmuebles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Mis inmuebles
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {loading
              ? "Cargando..."
              : `${inmuebles.length} ${inmuebles.length === 1 ? "inmueble publicado" : "inmuebles publicados"}`}
          </p>
        </div>
        <Link to="/inmuebles/crear" className="btn-primary shrink-0">
          + Crear inmueble
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-96 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      ) : inmuebles.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <svg
            className="h-20 w-20 text-slate-300 dark:text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
            Aún no tienes inmuebles publicados
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Crea tu primer inmueble para que aparezca en esta lista.
          </p>
          <Link to="/inmuebles/crear" className="mt-6 btn-primary">
            Crear inmueble
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {inmuebles.map((item) => (
            <PropertyCard key={item.id} property={item} tall />
          ))}
        </div>
      )}
    </div>
  );
}
