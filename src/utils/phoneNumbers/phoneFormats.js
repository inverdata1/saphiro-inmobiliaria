import phoneFormats from "./phone-number-formats.json";

export const phoneFormatsByIso2 = new Map(phoneFormats.map((c) => [c.iso2, c]));

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

export const validacionesTelefono = new Map(
  phoneFormats.map((c) => {
    const partes = String(c.national_length || "").split("-");
    const min = Number(partes[0]);
    const max = partes.length > 1 ? Number(partes[1]) : min;
    return [
      c.iso2,
      {
        country: c.country,
        code: c.country_code,
        min: Number.isNaN(min) ? null : min,
        max: Number.isNaN(max) ? (Number.isNaN(min) ? null : min) : max,
        ejemplo: c.example,
        formato: c.format,
        patron: construirPatron(c.format),
      },
    ];
  })
);

export function validarNumeroTelefono(iso2, numero) {
  const conf = validacionesTelefono.get(iso2);
  if (!conf) return { ok: false, mensaje: "El código de país seleccionado no es válido" };
  const soloDigitos = String(numero || "").replace(/\D/g, "");
  if (!soloDigitos || !conf.min) return { ok: true };
  const n = soloDigitos.length;
  if (n < conf.min || n > conf.max) {
    return {
      ok: false,
      mensaje: `Número inválido para ${conf.country}: debe tener ${conf.min}${conf.max !== conf.min ? `-${conf.max}` : ""} dígitos`,
    };
  }
  if (conf.patron) {
    const limpio = String(numero || "").replace(/[^\d()\s-]/g, "");
    if (!conf.patron.test(limpio)) {
      return {
        ok: false,
        mensaje: `Formato inválido para ${conf.country}. Ejemplo: ${conf.ejemplo}`,
      };
    }
  }
  return { ok: true };
}

export function limitarNumero(valor, max) {
  const str = String(valor || "");
  let vistos = "";
  const solo = str.split("").filter((ch) => {
    if (/\d/.test(ch)) return true;
    if (ch === "(" && !vistos.includes("(")) {
      vistos += "(";
      return true;
    }
    if (ch === ")" && vistos.includes("(") && !vistos.includes(")")) {
      vistos += ")";
      return true;
    }
    return false;
  });
  if (!max) return solo.join("");
  let digitos = 0;
  const out = [];
  for (const ch of solo) {
    if (/\d/.test(ch)) {
      if (digitos >= max) continue;
      digitos++;
    }
    out.push(ch);
  }
  return out.join("");
}

export function contarDigitos(numero) {
  return String(numero || "").replace(/\D/g, "").length;
}

export default phoneFormats;