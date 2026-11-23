const test = require("node:test");
const assert = require("node:assert/strict");
const { montoACobrar } = require("./cobroReserva");

test("la inicial es el 50% del total de la reserva", () => {
  assert.deepEqual(montoACobrar({ total: 1000, precioNoche: 80, nochesEstadia: 7 }), {
    monto: 500,
    noches: null,
    modo: "mitad",
  });
  assert.equal(montoACobrar({ total: 27.8, precioNoche: 10, nochesEstadia: 2 }).monto, 13.9);
});

test("si no paga el 50%, cobra las noches que elija", () => {
  assert.deepEqual(
    montoACobrar({ total: 700, precioNoche: 80, nochesEstadia: 7, modo: "noches", noches: 2 }),
    { monto: 160, noches: 2, modo: "noches" }
  );
  assert.equal(
    montoACobrar({ total: 700, precioNoche: 80, nochesEstadia: 7, modo: "noches", noches: 3 }).monto,
    240
  );
});

test("no deja cobrar más noches que la estadía", () => {
  assert.throws(
    () => montoACobrar({ total: 700, precioNoche: 80, nochesEstadia: 7, modo: "noches", noches: 8 }),
    (err) => err.code === "NOCHES"
  );
  assert.throws(
    () => montoACobrar({ total: 700, precioNoche: 80, nochesEstadia: 7, modo: "noches", noches: 0 }),
    (err) => err.code === "NOCHES"
  );
});
