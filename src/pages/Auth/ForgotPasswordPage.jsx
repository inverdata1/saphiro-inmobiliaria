import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiPost } from "../../api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const dragging = useRef(false);
  const dragStart = useRef(0);
  const [selectedRange, setSelectedRange] = useState(null);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await apiPost("/auth/forgot-password", { email });
      setTimeLeft(300);
      setStep(2);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    setSelectedRange(null);
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      const next = document.getElementById(`code-${index + 1}`);
      if (next) next.focus();
    }
  }

  function handleCodeKeyDown(index, e) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prev = document.getElementById(`code-${index - 1}`);
      if (prev) prev.focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedRange) {
      e.preventDefault();
      const text = code.slice(selectedRange.start, selectedRange.end + 1).join("");
      navigator.clipboard.writeText(text);
    }
  }

  function handleCodePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || "";
    }
    setCode(newCode);
    const focusIndex = Math.min(pasted.length, 5);
    const next = document.getElementById(`code-${focusIndex}`);
    if (next) next.focus();
  }

  function handleCodeMouseDown(index) {
    dragging.current = true;
    dragStart.current = index;
    setSelectedRange({ start: index, end: index });
  }

  function handleCodeMouseEnter(index) {
    if (!dragging.current) return;
    setSelectedRange({ start: Math.min(dragStart.current, index), end: Math.max(dragStart.current, index) });
  }

  function handleCodeMouseUp() {
    dragging.current = false;
  }

  function handleCodeDoubleClick() {
    setSelectedRange({ start: 0, end: 5 });
  }

  useEffect(() => {
    const up = () => { dragging.current = false; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  useEffect(() => {
    if (!selectedRange) return;
    for (let i = selectedRange.start; i <= selectedRange.end; i++) {
      const el = document.getElementById(`code-${i}`);
      if (el) el.select();
    }
  }, [selectedRange]);

  async function handleCodeSubmit(e) {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setErr("Ingresa los 6 dígitos del código");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const data = await apiPost("/auth/verify-reset-code", { email, code: fullCode });
      setResetToken(data.data.resetToken);
      setStep(3);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setErr("");
    if (newPassword.length < 6) {
      setErr("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/auth/reset-password", { email, resetToken, newPassword });
      navigate("/login");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  async function handleResendCode() {
    setErr("");
    setLoading(true);
    try {
      await apiPost("/auth/forgot-password", { email });
      setTimeLeft(300);
      setCode(["", "", "", "", "", ""]);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {step === 1 ? "Recuperar contraseña" : step === 2 ? "Verificar código" : "Nueva contraseña"}
          </div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {step === 1
              ? "Ingresa tu correo para recibir un código de verificación"
              : step === 2
              ? `Se envió un código de 6 dígitos a ${email}`
              : "Ingresa tu nueva contraseña"}
          </div>
        </div>

        <div className="card p-6 space-y-5">
          {err && (
            <div className="p-3 rounded-xl border bg-red-50 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {err}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loading ? "Enviando…" : "Enviar código"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleCodeSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Código de verificación
                </label>
                <div className="mt-2 flex justify-between gap-2">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      id={`code-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      onPaste={handleCodePaste}
                      onDoubleClick={handleCodeDoubleClick}
                      onMouseDown={() => handleCodeMouseDown(i)}
                      onMouseEnter={() => handleCodeMouseEnter(i)}
                      onMouseUp={handleCodeMouseUp}
                      onDragStart={(e) => e.preventDefault()}
                      className={`h-12 w-12 rounded-xl border bg-white text-center text-lg font-bold shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900 ${
                        selectedRange && i >= selectedRange.start && i <= selectedRange.end
                          ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/40"
                          : "border-slate-200 dark:border-slate-600"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || timeLeft <= 0}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loading ? "Verificando…" : "Verificar código"}
              </button>

              {timeLeft > 0 ? (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  El código expira en{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {minutes}:{seconds}
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-50"
                >
                  {loading ? "Reenviando…" : "Reenviar código"}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setTimeLeft(0);
                  setCode(["", "", "", "", "", ""]);
                  setErr("");
                }}
                className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Usar otro correo
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Nueva contraseña
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Confirmar contraseña
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loading ? "Guardando…" : "Cambiar contraseña"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            ¿Recordaste tu contraseña?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
