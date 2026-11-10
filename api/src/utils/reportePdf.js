const PDFDocument = require("pdfkit");

// Fecha/hora en la zona del pool (America/Caracas) para headers del reporte.
const FMT_FECHA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Caracas",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hour12: false,
});

// Nombres legibles para los títulos (clave = tipo/endpoint).
const TITULOS = {
  resumen: "Resumen",
  "top-corredores": "Top corredores",
  "por-tipo": "Por tipo de operación",
  "estatus-pago": "Estatus de pago",
  transacciones: "Transacciones",
  ventas: "Ventas",
  alquileres: "Alquileres",
  "disponibilidad-propiedades": "Disponibilidad de propiedades",
  ingresos: "Ingresos y comisiones",
  clientes: "Clientes y prospectos",
};

function textoCelda(valor) {
  if (valor === null || valor === undefined) return "";
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return "";
    const [fecha, hora] = FMT_FECHA.format(valor).replace(",", "").split(" ");
    return hora && !hora.startsWith("00:00") ? `${fecha} ${hora}` : fecha;
  }
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

/**
 * Genera un PDF (buffer) con el título, el período y una tabla de `data`.
 * - `tipo` → clave para el título legible.
 * - `meta` → { desde, hasta } opcional.
 * `data` es un array de filas planas (objetos).
 */
function generarPDF(tipo, { data = [], meta = {} } = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 30,
        bufferPages: true,
      });

      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const colorMarca = "#470A68";
      const colorGris = "#64748b";
      const izquierda = doc.page.margins.left;
      const anchoUtil = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      // --- Encabezado ---
      doc.fillColor(colorMarca).font("Helvetica-Bold").fontSize(16)
        .text(`Reporte de ${TITULOS[tipo] || tipo}`, izquierda, doc.page.margins.top);

      doc.moveDown(0.2);
      doc.fillColor(colorGris).font("Helvetica").fontSize(9);

      const periodo = meta.desde || meta.hasta
        ? `Período: ${meta.desde || "inicio"} — ${meta.hasta || "hoy"}`
        : "Período: completo";
      doc.text(`${periodo}   ·   Generado: ${FMT_FECHA.format(new Date())}   ·   ${data.length} registro(s)`);

      doc.moveDown(0.6);

      if (!data.length) {
        doc.fillColor("#000000").fontSize(11).font("Helvetica-Oblique").text("Sin datos para el período seleccionado.");
        doc.end();
        return;
      }

      // --- Tabla ---
      const columnas = Object.keys(data[0]);
      const tamFuente = columnas.length > 12 ? 6.5 : columnas.length > 8 ? 7 : 8;
      const altoFila = tamFuente + 8;
      const anchoCol = anchoUtil / columnas.length;

      const dibujarCabecera = (y) => {
        doc.rect(izquierda, y, anchoUtil, altoFila).fill(colorMarca);
        doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(tamFuente);
        columnas.forEach((col, i) => {
          doc.text(col, izquierda + i * anchoCol + 3, y + 4, {
            width: anchoCol - 6,
            height: altoFila - 6,
            ellipsis: true,
          });
        });
        doc.fillColor("#000000");
        return y + altoFila;
      };

      let y = dibujarCabecera(doc.y);
      const limite = doc.page.height - doc.page.margins.bottom;

      data.forEach((fila, idx) => {
        if (y + altoFila > limite) {
          doc.addPage();
          y = dibujarCabecera(doc.page.margins.top);
        }
        if (idx % 2 === 1) {
          doc.rect(izquierda, y, anchoUtil, altoFila).fill("#f1f5f9");
        }
        doc.fillColor("#0f172a").font("Helvetica").fontSize(tamFuente);
        columnas.forEach((col, i) => {
          doc.text(textoCelda(fila[col]), izquierda + i * anchoCol + 3, y + 4, {
            width: anchoCol - 6,
            height: altoFila - 6,
            ellipsis: true,
          });
        });
        y += altoFila;
      });

      // --- Numeración de páginas ---
      const rango = doc.bufferedPageRange();
      for (let p = 0; p < rango.count; p++) {
        doc.switchToPage(rango.start + p);
        doc.fillColor(colorGris).font("Helvetica").fontSize(8)
          .text(
            `Página ${p + 1} de ${rango.count}`,
            izquierda,
            doc.page.height - doc.page.margins.bottom + 6,
            { width: anchoUtil, align: "right" }
          );
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { generarPDF, TITULOS };
