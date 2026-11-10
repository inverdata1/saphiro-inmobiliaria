import { useNavigate } from "react-router-dom";
import InmuebleForm from "../../components/Inmuebles/InmuebleForm";

export default function CrearInmueblePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto py-6">
      <nav className="mb-4 flex items-center gap-1.5 px-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 font-medium whitespace-nowrap transition-colors hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
        >
          ← Volver
        </button>
      </nav>

      <div className="mb-6 px-6">
        <div className="text-2xl font-extrabold dark:text-slate-100">Crear inmueble</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">Ingresa los datos del nuevo inmueble.</div>
      </div>

      <div className="px-6 card">

        <InmuebleForm />
      </div>

    </div>
  );
}
