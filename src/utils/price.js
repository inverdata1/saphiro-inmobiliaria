export function formatPrice(value, moneda, alquilerVacacional) {
  const num = Number(value || 0);
  const m = (moneda || "USD").toUpperCase();
  const fmt = (v) => {
    const formatted = Number(v).toLocaleString("en-US");
    if (m === "EUR") return `${formatted}€`;
    if (m === "BS") return `${formatted} Bs.`;
    return `$${formatted}`;
  };
  if (alquilerVacacional && alquilerVacacional.precio_por_noche != null) {
    const noches = `${fmt(alquilerVacacional.precio_por_noche)} / noche`;
    return num > 0 ? `${fmt(num)} + ${noches}` : noches;
  }
  return fmt(num);
}
