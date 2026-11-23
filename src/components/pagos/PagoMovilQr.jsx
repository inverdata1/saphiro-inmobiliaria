import { QRCodeSVG } from "qrcode.react";

export function textoPagoMovil(data) {
  if (!data) return "";
  const lineas = [
    data.banco ? `Banco: ${data.banco}` : "",
    data.telefono ? `Telefono: ${data.telefono}` : "",
    data.cedula ? `Cedula: ${data.cedula}` : "",
    data.titular ? `Titular: ${data.titular}` : "",
  ].filter(Boolean);
  if (!lineas.length) return "";
  return ["PAGO MOVIL", ...lineas].join("\n");
}

export function PagoMovilQr({ texto, size = 180 }) {
  if (!texto) return null;
  return (
    <QRCodeSVG
      value={texto}
      size={size}
      level="M"
      includeMargin
      aria-label="QR de pago móvil"
    />
  );
}
