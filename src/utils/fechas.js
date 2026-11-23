export function parseFechaLocal(value) {
  const [y, m, d] = String(value || "").slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function formatFechaLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function sumarDias(ymd, days) {
  const date = parseFechaLocal(ymd);
  if (!date) return "";
  date.setDate(date.getDate() + days);
  return formatFechaLocal(date);
}

export function diaSiguiente(ymd) {
  return sumarDias(ymd, 1);
}

export function nochesEntre(entrada, salida) {
  const a = parseFechaLocal(entrada);
  const b = parseFechaLocal(salida);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function claseDiaReserva(dateStr, entrada, salida) {
  if (!dateStr) return "";
  if (entrada && dateStr === entrada) return "fc-dia-entrada";
  if (salida && dateStr === salida) return "fc-dia-salida";
  if (entrada && salida && dateStr > entrada && dateStr < salida) return "fc-dia-rango";
  return "";
}

export function mostrarFecha(ymd) {
  if (!ymd) return "";
  const [y, m, d] = String(ymd).split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}
