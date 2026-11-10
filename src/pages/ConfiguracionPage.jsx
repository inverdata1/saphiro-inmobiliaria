import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useSettings } from "../hooks/useSettings";
import Modal from "../components/Modal";

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const { settings, updateSetting } = useSettings();

  const [activeTab, setActiveTab] = useState("general");
  const [toastMessage, setToastMessage] = useState("");
  const [modalPasswordOpen, setModalPasswordOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);

  // Estados de formularios
  const [passwordForm, setPasswordForm] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });
  const [passwordFeedback, setPasswordFeedback] = useState({ tipo: "", msg: "" });
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordFeedback({ tipo: "", msg: "" });

    if (!passwordForm.actual || !passwordForm.nueva || !passwordForm.confirmar) {
      setPasswordFeedback({ tipo: "error", msg: "Por favor completa todos los campos de contraseña." });
      return;
    }
    if (passwordForm.nueva.length < 8) {
      setPasswordFeedback({ tipo: "error", msg: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (passwordForm.nueva !== passwordForm.confirmar) {
      setPasswordFeedback({ tipo: "error", msg: "Las contraseñas nuevas no coinciden." });
      return;
    }

    setCambiandoPassword(true);
    setTimeout(() => {
      setCambiandoPassword(false);
      setPasswordFeedback({ tipo: "success", msg: "Contraseña actualizada con éxito." });
      setPasswordForm({ actual: "", nueva: "", confirmar: "" });
      setTimeout(() => {
        setModalPasswordOpen(false);
        setPasswordFeedback({ tipo: "", msg: "" });
        showToast("Contraseña modificada correctamente.");
      }, 1500);
    }, 1000);
  };

  // Definición de pestañas
  const tabs = [
    {
      id: "general",
      label: "General y Pantalla",
      desc: "Tema y apariencia visual",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      id: "notificaciones",
      label: "Notificaciones y Alertas",
      desc: "Alertas de precios y rentas",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: "seguridad",
      label: "Seguridad y Accesos",
      desc: "Contraseña y zona de peligro",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0c0e] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white dark:bg-purple-950 dark:text-purple-100 border border-purple-500/30 px-5 py-3 rounded-2xl shadow-xl transition-all animate-bounce">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabecera / Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <Link to="/" className="hover:text-purple-600 dark:hover:text-purple-400">Inicio</Link>
              <span>/</span>
              <span>Ajustes</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Configuración y Preferencias
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Personaliza tu experiencia inmobiliaria, formatos de precios, alertas automáticas y parámetros del portal.
            </p>
          </div>

        </div>

        {/* Layout Principal: Tabs laterales + Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Navegación lateral de Pestañas */}
          <div className="lg:col-span-4 xl:col-span-3">
            {/* Versión móvil scroll horizontal */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 scrollbar-none">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-purple-700 text-white shadow-sm"
                        : "bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Versión desktop: Tarjeta lateral */}
            <div className="hidden lg:block bg-white dark:bg-[#111116] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-2.5 shadow-sm space-y-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-start gap-3.5 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border-l-4 border-purple-600 dark:border-purple-400"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 font-medium"
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 ${isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`}>
                      {tab.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold truncate">{tab.label}</span>
                        {tab.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                            {tab.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-500 truncate mt-0.5">{tab.desc}</p>
                    </div>
                  </button>
                );
              })}

              {/* Tarjeta de estado de usuario actual */}
              {user && (
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 px-3 pb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                      {user.foto_perfil || user.avatar ? (
                        <img src={user.foto_perfil || user.avatar} alt={user.nombre} className="w-full h-full object-cover" />
                      ) : (
                        (user.nombre || "U").slice(0, 2)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.nombre || "Usuario"}</p>
                      <p className="text-[11px] text-slate-400 capitalize">{user.rol || "Cliente"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel de Contenido de la Pestaña Activa */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* ══════════════ TAB 1: GENERAL Y PANTALLA ══════════════ */}
            {activeTab === "general" && (
              <div className="space-y-6 animate-fadeIn">
                {/* Sección Apariencia */}
                <div className="bg-white dark:bg-[#111116] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      Apariencia y Tema
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Elige el aspecto visual de la plataforma según tus preferencias o iluminación de tu espacio.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        key: "light",
                        label: "Modo Claro",
                        desc: "Fondos luminosos y contrastados",
                        icon: (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="5" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                          </svg>
                        ),
                      },
                      {
                        key: "dark",
                        label: "Modo Oscuro",
                        desc: "Descanso visual y bajo consumo",
                        icon: (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                          </svg>
                        ),
                      },
                      {
                        key: "auto",
                        label: "Automático (Sistema)",
                        desc: "Se adapta a tu sistema operativo",
                        icon: (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        ),
                      },
                    ].map((mode) => (
                      <button
                        key={mode.key}
                        type="button"
                        onClick={() => updateSetting("tema", mode.key)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          settings.tema === mode.key
                            ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 ring-2 ring-purple-600/20"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-[#16161c]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={settings.tema === mode.key ? "text-purple-600 dark:text-purple-400" : "text-slate-500"}>
                            {mode.icon}
                          </span>
                          {settings.tema === mode.key && (
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold">{mode.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{mode.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sección Formato Numérico */}
                <div className="bg-white dark:bg-[#111116] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      Formato Numérico
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Define cómo se muestran los importes en fichas, contratos y recibos.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Formato de Separador de Miles */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Formato Numérico
                      </label>
                      <select
                        value={settings.formatoNumero}
                        onChange={(e) => updateSetting("formatoNumero", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                      >
                        <option value="coma_decimal">1.250,00 (Punto miles, coma decimales)</option>
                        <option value="punto_decimal">1,250.00 (Coma miles, punto decimales)</option>
                      </select>
                      <p className="text-[11px] text-slate-500">Estilo para tablas de comisiones y recibos.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ TAB 2: NOTIFICACIONES Y ALERTAS ══════════════ */}
            {activeTab === "notificaciones" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white dark:bg-[#111116] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Alertas Automáticas de la Plataforma
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Elige qué eventos inmobiliarios activan alertas para no perderte oportunidades ni fechas de pago.
                    </p>
                  </div>

                  {/* Lista de alertas */}
                  <div className="space-y-3.5">
                    {[
                      {
                        key: "notifNuevosInmuebles",
                        title: "Nuevas propiedades según mis intereses",
                        desc: "Recibe un aviso cuando se publiquen inmuebles en tu zona o rango de precio preferido.",
                      },
                      {
                        key: "notifBajaPrecio",
                        title: "Baja de precio en Inmuebles Guardados",
                        desc: "Entérate al instante si un propietario o corredor rebaja el precio de tus favoritos.",
                      },
                      {
                        key: "notifCambioEstatus",
                        title: "Cambio de estatus (Reservado a Disponible)",
                        desc: "Avisarte si una propiedad que seguías se libera de una reserva fallida.",
                      },
                      {
                        key: "notifVencimientoRenta",
                        title: "Recordatorio de vencimiento de mensualidades",
                        desc: "Avisos 3 y 5 días antes de la fecha límite para transferir tu canon de arrendamiento.",
                      },
                      {
                        key: "notifRecibosPagos",
                        title: "Confirmaciones y recibos de pago",
                        desc: "Notificación inmediata cada vez que se emita o valide un recibo de transferencia.",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition"
                      >
                        <div className="pr-4">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={!!settings[item.key]}
                            onChange={(e) => updateSetting(item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ TAB 3: SEGURIDAD Y ACCESOS ══════════════ */}
            {activeTab === "seguridad" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white dark:bg-[#111116] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Seguridad de la Cuenta
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Mantén tu cuenta protegida con contraseñas seguras.
                    </p>
                  </div>

                  {/* Cambio de Contraseña */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Contraseña de Acceso</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Recomendamos cambiar tu contraseña periódicamente y usar al menos 8 caracteres.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalPasswordOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
                    >
                      Actualizar Contraseña
                    </button>
                  </div>

                  {/* Zona de Peligro */}
                  <div className="pt-4 border-t border-red-100 dark:border-red-950/40">
                    <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">Zona Peligrosa</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          Desactivar o solicitar la eliminación definitiva de tu cuenta y datos asociados.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalDeleteOpen(true)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
                      >
                        Eliminar Cuenta
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════ MODAL: CAMBIO DE CONTRASEÑA ══════════════ */}
      <Modal open={modalPasswordOpen} onClose={() => setModalPasswordOpen(false)}>
        <div className="bg-white dark:bg-[#16161c] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Cambiar Contraseña
            </h3>
            <button
              type="button"
              onClick={() => setModalPasswordOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          {passwordFeedback.msg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                passwordFeedback.tipo === "success"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
              }`}
            >
              {passwordFeedback.msg}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contraseña Actual</label>
              <input
                type="password"
                required
                value={passwordForm.actual}
                onChange={(e) => setPasswordForm({ ...passwordForm, actual: e.target.value })}
                className="mt-1 w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nueva Contraseña</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.nueva}
                onChange={(e) => setPasswordForm({ ...passwordForm, nueva: e.target.value })}
                className="mt-1 w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-purple-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Mínimo 8 caracteres, combinando números y letras.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                required
                value={passwordForm.confirmar}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmar: e.target.value })}
                className="mt-1 w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setModalPasswordOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cambiandoPassword}
                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {cambiandoPassword ? "Guardando…" : "Actualizar Contraseña"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ══════════════ MODAL: ELIMINAR CUENTA ══════════════ */}
      <Modal open={modalDeleteOpen} onClose={() => setModalDeleteOpen(false)}>
        <div className="bg-white dark:bg-[#16161c] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Solicitar Eliminación de Cuenta</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Esta acción es irreversible. Se eliminarán tus inmuebles guardados, historiales y preferencias.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalDeleteOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setModalDeleteOpen(false);
                showToast("Solicitud enviada a soporte de administración.");
              }}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm"
            >
              Confirmar Solicitud
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

