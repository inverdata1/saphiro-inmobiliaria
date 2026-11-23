export function formatPrice(inmueble) {
  const num = Number(inmueble?.precio ?? 0);
  const m = (inmueble?.moneda ?? "USD").toUpperCase();
  
  const fmt = (v) => {
    const formatted = Number(v).toLocaleString("en-US");
    if (m === "EUR") return `${formatted}€`;
    if (m === "BS") return `${formatted} Bs.`;
    return `$${formatted}`;
  };

  const porNoche = inmueble?.precio_por_noche ?? inmueble?.alquiler_vacacional?.precio_por_noche ?? inmueble?.precio_por_noche;
  if (porNoche != null) {
    const noches = `${fmt(porNoche)} / noche`;
    return num > 0 ? `${fmt(num)} + ${noches}` : noches;
  }

  const porMes = inmueble?.precio_por_mes ?? inmueble?.precio_mes ?? inmueble?.alquiler_fijo?.precio_mes;

  if (porMes != null) {
    const mes = `${fmt(porMes)} / mes`;
    return num > 0 ? `${fmt(num)} + ${mes}` : mes;
  }
  return fmt(num);
}