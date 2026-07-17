import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiDelete } from "../api";
import { useAuth } from "../context/AuthContext";
import PropertyCard from "../components/PropertyCard";

export default function GuardadosPage() {
  const { user } = useAuth();
  const [guardados, setGuardados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (async () => {
      try {
        const r = await apiGet(`/guardados/${user.id}`);
        setGuardados(Array.isArray(r?.data) ? r.data : []);
      } catch {
        setGuardados([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const handleRemove = async (inmueble_id) => {
    if (!user?.id) return;
    setRemoving(inmueble_id);
    try {
      await apiDelete(`/guardados/${user.id}/${inmueble_id}`);
      setGuardados((prev) => prev.filter((g) => g.id !== inmueble_id));
    } catch (e) {
      console.error("Error al eliminar guardado:", e);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Guardados
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {guardados.length} {guardados.length === 1 ? "inmueble guardado" : "inmuebles guardados"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-96 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      ) : guardados.length === 0 ? (
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
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
            No tienes inmuebles guardados
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Cuando guardes un inmueble, aparecerá aquí para que puedas verlo después.
          </p>
          <Link
            to="/inmuebles"
            className="mt-6 btn-primary"
          >
            Explorar inmuebles
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {guardados.map((item) => (
            <div
              key={item.id}
              className={`relative group select-none transition-all duration-300 ${
                removing === item.id
                  ? "opacity-0 scale-95"
                  : "opacity-100 scale-100"
              }`}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              style={{ touchAction: "manipulation", WebkitTouchCallout: "none" }}
            >
              <PropertyCard property={item} tall />
              <button
                onClick={() => handleRemove(item.id)}
                className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                title="Quitar de guardados"
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
