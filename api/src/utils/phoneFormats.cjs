const phoneFormats = require("./phoneNumbers/phone-number-formats.json");

const phoneFormatsByIso2 = new Map(phoneFormats.map((c) => [c.iso2, c]));

function construirPatron(formato) {
  const nacional = String(formato || "").replace(/^\+\d{1,4}\s*/, "");
  let out = "[\\s\\-()]*";
  let cuenta = 0;
  let enRun = false;
  const cerrar = () => {
    if (enRun) {
      out += cuenta + "}";
      enRun = false;
    }
  };
  for (const ch of nacional) {
    if (ch === "X") {
      if (!enRun) {
        out += "\\d{";
        cuenta = 0;
        enRun = true;
      }
      cuenta++;
    } else if (/[0-9]/.test(ch)) {
      cerrar();
      out += `[${ch}]`;
    } else {
      cerrar();
      out += "[\\s\\-()]*";
    }
  }
  cerrar();
  out += "[\\s\\-()]*";
  try {
    return new RegExp(`^${out}$`);
  } catch {
    return null;
  }
}

const validacionesTelefono = new Map(
  phoneFormats.map((c) => {
    const partes = String(c.national_length || "").split("-");
    const min = Number(partes[0]);
    const max = partes.length > 1 ? Number(partes[1]) : min;
    return [
      c.iso2,
      {
        country: c.country,
        code: c.country_code,
        codeDigits: String(c.country_code || "").replace(/\D/g, ""),
        min: Number.isNaN(min) ? null : min,
        max: Number.isNaN(max) ? (Number.isNaN(min) ? null : min) : max,
        ejemplo: c.example,
        patron: construirPatron(c.format),
      },
    ];
  })
);

// numeroConCodigo: E.164, ej. "+18092345678"
function validarTelefono(iso2, numeroConCodigo) {
  const conf = validacionesTelefono.get(iso2);
  if (!conf) return { ok: false, mensaje: "El código de país seleccionado no es válido" };

  const soloDigitos = String(numeroConCodigo || "").replace(/\D/g, "");
  if (!soloDigitos) return { ok: false, mensaje: "El teléfono es requerido" };

  if (conf.codeDigits && !soloDigitos.startsWith(conf.codeDigits)) {
    return {
      ok: false,
      mensaje: `El número no corresponde al código de país seleccionado (${conf.code}) para ${conf.country}`,
    };
  }

  const nacional = conf.codeDigits ? soloDigitos.slice(conf.codeDigits.length) : soloDigitos;
  if (!nacional) return { ok: false, mensaje: `El teléfono no tiene número para ${conf.country}` };

  if (conf.min !== null && (nacional.length < conf.min || (conf.max !== null && nacional.length > conf.max))) {
    return {
      ok: false,
      mensaje: `Número inválido para ${conf.country}: debe tener ${conf.min}${conf.max !== conf.min ? `-${conf.max}` : ""} dígitos`,
    };
  }

  if (conf.patron && !conf.patron.test(soloDigitos.slice(conf.codeDigits.length))) {
    return {
      ok: false,
      mensaje: `Formato inválido para ${conf.country}. Ejemplo: ${conf.ejemplo}`,
    };
  }

  return { ok: true, normalizado: `${conf.code} ${nacional}` };
}

module.exports = { phoneFormats, phoneFormatsByIso2, validacionesTelefono, validarTelefono };