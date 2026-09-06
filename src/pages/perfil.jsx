import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGet, apiPatch } from "../api";

export default function Perfil() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Inicializar nombre completo desde el contexto (síncrono, instantáneo)
  const [nombreCompleto, setNombreCompleto] = useState(user?.nombre || "");
  const [previewFoto, setPreviewFoto] = useState(user?.foto_perfil || user?.avatar || "");
  const [editingNombre, setEditingNombre] = useState(false);
  
  // Estados de interfaz
  const [isDragging, setIsDragging] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  // Cargar nombre y foto del servidor
  useEffect(() => {
    let isMounted = true;

    const cargarUsuario = async () => {
      // Mostrar de inmediato el nombre del contexto (viene de /auth/me) sin flash
      if (isMounted) {
        setNombreCompleto(user?.nombre || "");
        setPreviewFoto(user?.foto_perfil || user?.avatar || "");
      }

      if (!user?.id) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await apiGet(`/usuarios/${user.id}`);
        const data = res?.data || res;

        if (isMounted && data) {
          setNombreCompleto(data.nombre || "");
          const foto = data.foto_perfil || data.avatar || "";
          setPreviewFoto(foto);
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    cargarUsuario();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Generar iniciales para el avatar de respaldo
  const initials = nombreCompleto
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "US";

  // Procesar archivo de imagen seleccionado
  const handleFileChange = (file) => {
    if (!file) return;

    // Validación de tipo de archivo
    if (!file.type.startsWith("image/")) {
      setMensajeError("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).");
      return;
    }

    // Validación de tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMensajeError("La imagen no debe superar los 5 MB de tamaño.");
      return;
    }

    setMensajeError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setPreviewFoto(dataUrl);
      setMensajeExito("Foto seleccionada. Recuerda guardar los cambios.");
    };
    reader.readAsDataURL(file);
  };

  const handleInputFile = (e) => {
    const file = e.target.files?.[0];
    handleFileChange(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileChange(file);
  };

  // Quitar foto de perfil
  const handleEliminarFoto = () => {
    setPreviewFoto("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMensajeExito("Foto eliminada. Guarda los cambios para confirmar.");
  };

  // Guardar nombre en el servidor y actualizar contexto local
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeError("");
    setMensajeExito("");

    const nombreLimpio = nombreCompleto.trim();

    if (!nombreLimpio) {
      setMensajeError("El nombre es un campo obligatorio.");
      return;
    }

    setGuardando(true);

    try {
      await apiPatch(`/usuarios/me`, { nombre: nombreLimpio });

      // Actualizar contexto local con el nuevo nombre (los demás datos quedan igual)
      if (updateUser) {
        const nuevosDatos = { nombre: nombreLimpio, nombre_pila: nombreLimpio, apellido: "" };
        updateUser(nuevosDatos);
      }

      setEditingNombre(false);
      setMensajeExito("¡Tu nombre ha sido actualizado con éxito!");
    } catch (err) {
      setMensajeError(err?.message || "Error al actualizar el nombre.");
    } finally {
      setGuardando(false);
    }

    // Limpiar mensaje tras 4 segundos
    if (!mensajeError) {
      setTimeout(() => setMensajeExito(""), 4000);
    }
  };

  // Color de badge según rol
  const roleBadgeConfig = {
    admin: { label: "Administrador", bg: "bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
    corredor: { label: "Corredor Inmobiliario", bg: "bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
    cliente: { label: "Cliente", bg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  };

  const rolInfo = roleBadgeConfig[user?.rol] || roleBadgeConfig.cliente;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 dark:bg-[#0c0c0e] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Barra superior con navegación hacia atrás */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-purple-900 dark:hover:text-purple-400 transition-colors cursor-pointer group"
          >
            <span className="p-1.5 rounded-lg bg-white dark:bg-[#18181c] border border-slate-200 dark:border-slate-800 group-hover:border-purple-400 transition-all shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </span>
            <span>Volver</span>
          </button>

          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Ajustes de cuenta
          </span>
        </div>

        {/* Encabezado principal */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Mi Perfil
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administra tu información personal y foto de perfil.
          </p>
        </div>

        {/* Banners de estado */}
        {mensajeExito && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-sm font-semibold animate-in fade-in duration-200">
            <svg className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="flex-1">{mensajeExito}</span>
            <button
              onClick={() => setMensajeExito("")}
              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 text-xs font-bold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {mensajeError && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300 text-sm font-semibold animate-in fade-in duration-200">
            <svg className="w-5 h-5 shrink-0 text-red-650 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className="flex-1">{mensajeError}</span>
            <button
              onClick={() => setMensajeError("")}
              className="text-red-650 hover:text-red-800 dark:text-red-400 text-xs font-bold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-[#141417] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xs flex flex-col items-center text-center">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="w-32 h-5 mt-4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="w-24 h-4 mt-2 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-[#141417] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-7 shadow-xs">
                <div className="space-y-5">
                  <div className="w-full h-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="w-full h-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="w-32 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse ml-auto" />
                </div>
              </div>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Columna Izquierda: Tarjeta de Avatar y Rol */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#141417] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xs flex flex-col items-center text-center">
              
              {/* Contenedor de Avatar con Drag & Drop */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative group rounded-full p-1.5 transition-all duration-300 ${
                  isDragging 
                    ? "ring-4 ring-purple-500 ring-offset-2 scale-105" 
                    : "hover:ring-4 hover:ring-purple-200 dark:hover:ring-purple-900/60"
                }`}
              >
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-gradient-to-br from-[#470A68] to-[#5a0e82] text-white flex items-center justify-center text-3xl sm:text-4xl font-black shadow-lg relative border-4 border-white dark:border-[#141417]">
                  {previewFoto ? (
                    <img
                      src={previewFoto}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}

                  {/* Overlay interactivo para cambiar foto al pasar el cursor */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                  >
                    <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[11px] font-bold">Cambiar</span>
                  </div>
                </div>
              </div>

              {/* Input de archivo oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleInputFile}
                className="hidden"
              />

              {/* Nombre y Rol */}
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-4 truncate max-w-full">
                {nombreCompleto || "Tu Nombre"}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate max-w-full">
                {user?.email || "correo@ejemplo.com"}
              </p>

              <div className="mt-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${rolInfo.bg}`}>
                  {rolInfo.label}
                </span>
              </div>

              {/* Botones de acción de la foto */}
              <div className="w-full mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#5a0e82" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#470A68")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#5a0e82")}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {previewFoto ? "Cambiar foto" : "Subir foto"}
                </button>

                {previewFoto && (
                  <button
                    type="button"
                    onClick={handleEliminarFoto}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Quitar foto
                  </button>
                )}

                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Formatos: JPG, PNG o WebP. Arrastra y suelta sobre la imagen.
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Formulario de Datos Personales */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#141417] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-7 shadow-xs">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-6">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Información Personal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Actualiza cómo aparecerá tu nombre en la plataforma y comprobantes.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Campo Nombre Completo */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="input-nombre"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      Nombre Completo <span className="text-purple-700">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditingNombre(!editingNombre)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      {editingNombre ? "Cancelar" : "Editar"}
                    </button>
                  </div>
                  <input
                    id="input-nombre"
                    type="text"
                    required
                    disabled={!editingNombre}
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all ${
                      editingNombre
                        ? "border-purple-300 dark:border-purple-700 bg-white dark:bg-[#1c1c21] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                        : "border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-[#18181c]/60 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
                    }`}
                  />
                </div>

                {/* Campo Correo Electrónico (Solo lectura) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="input-email"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      Correo Electrónico
                    </label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      Verificado
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="input-email"
                      type="email"
                      readOnly
                      disabled
                      value={user?.email || ""}
                      className="w-full px-3.5 py-2.5 pl-10 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-[#18181c]/60 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    El correo principal está vinculado a la seguridad de tu cuenta.
                  </p>
                </div>

                {/* Botón Guardar Cambios */}
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={guardando || !editingNombre}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    style={{ backgroundColor: "#5a0e82" }}
                    onMouseEnter={(e) => !guardando && editingNombre && (e.currentTarget.style.backgroundColor = "#470A68")}
                    onMouseLeave={(e) => !guardando && editingNombre && (e.currentTarget.style.backgroundColor = "#5a0e82")}
                  >
                    {guardando ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
        )}

      </div>
    </div>
  );
}
