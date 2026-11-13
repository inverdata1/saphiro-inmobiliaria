const PLANES = [
  { codigo: "basico", activos: 3, destacados: 0, asesores: 0 },
  { codigo: "pro", activos: 15, destacados: 1, asesores: 0 },
  { codigo: "pyme", activos: 50, destacados: 3, asesores: 3 },
  { codigo: "enterprise", activos: null, destacados: 10, asesores: null },
];

function planVigente(row, now = new Date()) {
  if (!row?.plan_pagado || !row.plan_codigo || row.plan_codigo === "basico") return false;
  if (!row.plan_vigente_hasta) return false;
  const hasta = new Date(row.plan_vigente_hasta);
  return !Number.isNaN(hasta.getTime()) && hasta.getTime() > now.getTime();
}

function cupoDe(row, now = new Date()) {
  const plan = planVigente(row, now) ? row.plan_codigo : "basico";
  const def = PLANES.find((p) => p.codigo === plan) || PLANES[0];
  const extra = Math.max(0, Number(row?.publicaciones_extra || 0));
  return {
    plan,
    limite: def.activos == null ? null : def.activos + extra,
    extra,
    destacados: def.destacados,
    asesores: def.asesores,
    verificada: plan === "pyme" || plan === "enterprise",
  };
}

module.exports = { cupoDe, planVigente, PLANES };
