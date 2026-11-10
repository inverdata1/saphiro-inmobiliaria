// Lineas del desglose de un comprobante. Funcion pura y exportada para poder
// probarla sin renderizar: la logica tiene varios casos limite (parcial, sobrante,
// sin detalle) y en un useMemo quedaba enterrada dentro del componente.
//
//   base   Monto cobrado (montoTotal en un recibo, montoBruto en una liquidacion).
//   baseLabel  Concepto a usar cuando no hay desglose (recibo: el total; liquidacion:
//              null, porque ahi la fila del bruto se pinta aparte y siempre).
//
// Devuelve las lineas que suman EXACTAMENTE la base, o [] cuando no corresponde
// desglosar. Tres casos:
//
//   1. Sin lineas validas: [baseLabel -> base] si hay baseLabel, si no [].
//   2. Desglose completo: las lineas tal cual.
//   3. Desglose parcial: se completa con la diferencia ("Otros conceptos no
//      desglosados") para que la suma de SIEMPRE la base. Un comprobante donde las
//      filas no cuadran se lee como un error, no como un desglose. Si las lineas dan
//      MAS que la base, se descarta el desglose entero por la misma razon.
export function buildDesglose(detalles, base, baseLabel = null) {
  const total = Number(base || 0);

  const lineas = (detalles || [])
    .map((d) => ({
      concepto: String(d?.concepto ?? "").trim(),
      monto: Number(d?.monto ?? 0),
    }))
    .filter((d) => d.concepto && Number.isFinite(d.monto));

  if (!lineas.length) {
    return baseLabel ? [{ concepto: baseLabel, monto: total }] : [];
  }

  const suma = Math.round(lineas.reduce((a, d) => a + d.monto, 0) * 100) / 100;
  const diferencia = Math.round((total - suma) * 100) / 100;

  if (diferencia < 0) return baseLabel ? [{ concepto: baseLabel, monto: total }] : [];

  if (diferencia > 0) {
    lineas.push({ concepto: "Otros conceptos no desglosados", monto: diferencia, parcial: true });
  }
  return lineas;
}
