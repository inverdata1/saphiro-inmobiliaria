// Comision del corredor sobre una cuota de alquiler, calculada en el cliente.
//
// El backend tambien la calcula, con un trigger de DB
// (trg_transacciones_Inmueble_aft_ins: `monto_comision = transacciones.monto_total *
// porcentaje_aplicado / 100`). El cliente NO usa ese valor ya calculado: reproduce la
// formula para no duplicar la fuente de verdad, y la API solo aporta el porcentaje del
// corredor de cada pago.
//
// Base del calculo: `monto_pagado`, el importe efectivamente cobrado de la cuota. NO
// `monto_meta` (el importe pactado): una cuota a medio pagar solo genera comision por
// lo cobrado, y una cuota impaga no genera comision alguna.
//
// OJO: el trigger usa `transacciones.monto_total`, que NO es lo mismo que
// `monto_pagado` cuando la cuota y su transaccion no cuadran (p. ej. el pago cubre
// tambien el mes administrativo, o hay datos inconsistentes). En ese caso el numero del
// cliente difiere del de la tabla `comisiones`, y el neto puede salir negativo. Se eligio
// `monto_pagado` a proposito (es lo coherente con lo que muestra el comprobante); si se
// necesita paridad exacta con el trigger, la base correcta es `monto_total` por abono.
//
// Se redondea UNA sola vez, al final. Redondear cada abono por separado pierde centavos
// en cuotas partidas en muchos pagos: 3 abonos de 33.33 al 10% dan 3.33 cada uno (9.99
// en total) cuando el trigger guarda 3.333 por abono y su suma exacta es 9.999 -> 10.00.
// Postgres usa `numeric` sin escala fija, asi que conserva la precision intermedia; el
// cliente la conserva igual sumando sin redondear y redondeando el total.
//
//   abonos  Lista de { montoPagado, porcentajeAplicado } de cada pago de la cuota. Un
//           pago sin porcentaje (dato viejo, comision aun no registrada) aporta 0.
//
// Devuelve el monto de comision (>= 0). Nunca NaN: entradas basura aportan 0.
export function calcularComision(abonos) {
  if (!Array.isArray(abonos) || !abonos.length) return 0;

  const total = abonos.reduce((sum, a) => {
    const monto = Number(a?.montoPagado || 0);
    const porcentaje = Number(a?.porcentajeAplicado || 0);
    if (!Number.isFinite(monto) || !Number.isFinite(porcentaje)) return sum;
    // Un porcentaje negativo o mayor a 100 seria un dato corrupto: se acota a [0, 100]
    // para que no genere una comision negativa (que inflaria el neto) ni mayor al cobro.
    const pct = Math.min(Math.max(porcentaje, 0), 100);
    return sum + monto * (pct / 100);
  }, 0);

  return Math.max(Math.round(total * 100) / 100, 0);
}
