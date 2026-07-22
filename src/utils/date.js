export function toYmd(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { desde: toYmd(start), hasta: toYmd(end) };
}

export function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(d) {
  if (!d) return "-";
  const date = new Date(d).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = new Date(d).toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time}`;
}
