function parseDateStr(s) {
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function reservasToEvents(reservas) {
  return (Array.isArray(reservas) ? reservas : []).flatMap((r) => {
    const start = parseDateStr(r.fecha_entrada);
    const end = parseDateStr(r.fecha_salida);
    if (!start || !end) return [];
    const events = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const day = d.toISOString().slice(0, 10);
      events.push({
        title: "Reservado",
        start: day,
        end: day,
        editable: false,
        classNames: ["fc-reserva-block"],
        extendedProps: { reserva: r },
      });
    }
    return events;
  });
}

export function fechasOcupadas(reservas) {
  const set = new Set();
  (Array.isArray(reservas) ? reservas : []).forEach((r) => {
    const start = parseDateStr(r.fecha_entrada);
    const end = parseDateStr(r.fecha_salida);
    if (!start || !end) return;
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      set.add(d.toISOString().slice(0, 10));
    }
  });
  return set;
}