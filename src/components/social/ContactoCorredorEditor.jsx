import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../../api";
import phoneFormats, { phoneFormatsByIso2, validacionesTelefono } from "../../utils/phoneNumbers/phoneFormats";
import SocialLinksEditor from "./SocialLinksEditor";

const MAX_TELEFONOS = 3;

export default function ContactoCorredorEditor({ usuarioId }) {
  const [telefonos, setTelefonos] = useState([]);
  const [iso2, setIso2] = useState("VE");
  const [numero, setNumero] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!usuarioId) return;
    let vivo = true;
    apiGet(`/corredores/${usuarioId}/telefonos`)
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (vivo) setTelefonos(data.filter((t) => t?.nro_telefono));
      })
      .catch(() => {
        if (vivo) setTelefonos([]);
      });
    return () => {
      vivo = false;
    };
  }, [usuarioId]);

  const pais = phoneFormatsByIso2.get(iso2) || phoneFormats[0];
  const maxDigitos = validacionesTelefono.get(iso2)?.max;

  async function agregar() {
    const digitos = numero.replace(/\D/g, "");
    if (!digitos || telefonos.length >= MAX_TELEFONOS) return;
    setGuardando(true);
    setError("");
    try {
      const res = await apiPost(`/corredores/${usuarioId}/telefonos`, {
        iso2,
        telefono: `${pais?.country_code || ""} ${digitos}`.trim(),
      });
      const data = res?.data || res;
      setTelefonos((prev) => [
        ...prev,
        {
          id: data.id,
          nro_telefono: data.nro_telefono || `${pais?.country_code || ""} ${digitos}`.trim(),
          codigo_pais: data.codigo_pais || iso2,
        },
      ]);
      setNumero("");
    } catch (e) {
      setError(e?.message || "No se pudo guardar el teléfono");
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(idTel) {
    setError("");
    try {
      await apiDelete(`/corredores/${usuarioId}/telefonos/${idTel}`);
      setTelefonos((prev) => prev.filter((t) => t.id !== idTel));
    } catch (e) {
      setError(e?.message || "No se pudo quitar el teléfono");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800/60 dark:bg-[#18181c]">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Teléfono de contacto</div>
        <p className="mt-1 text-xs text-slate-500">Sale en los inmuebles de este corredor. Máximo {MAX_TELEFONOS}.</p>
        {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
        <ul className="mt-3 space-y-2">
          {telefonos.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 text-sm font-bold text-slate-800 dark:text-white">
              <span>{t.nro_telefono}</span>
              <button type="button" onClick={() => quitar(t.id)} className="text-xs font-bold text-red-600 cursor-pointer">
                Quitar
              </button>
            </li>
          ))}
          {telefonos.length === 0 ? <li className="text-sm text-slate-400">Sin teléfono</li> : null}
        </ul>
        {telefonos.length < MAX_TELEFONOS ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select
              value={iso2}
              onChange={(e) => setIso2(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {phoneFormats.map((c) => (
                <option key={c.iso2} value={c.iso2}>{`(${c.country_code}) ${c.country}`}</option>
              ))}
            </select>
            <input
              value={numero}
              inputMode="numeric"
              maxLength={maxDigitos ? maxDigitos + 4 : 20}
              onChange={(e) => setNumero(e.target.value.replace(/[^\d\s-]/g, ""))}
              placeholder="0414 979 44 03"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              type="button"
              disabled={guardando || !numero.replace(/\D/g, "")}
              onClick={agregar}
              className="rounded-xl bg-[#5a0e82] px-4 py-2 text-sm font-bold text-white disabled:opacity-50 cursor-pointer"
            >
              {guardando ? "Guardando..." : "Agregar"}
            </button>
          </div>
        ) : null}
      </div>
      <SocialLinksEditor usuarioId={usuarioId} />
    </div>
  );
}
