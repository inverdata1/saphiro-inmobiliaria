import React from "react";

export default function CardPreview({
  cardNumber = "",
  cardHolder = "",
  cardExpiry = "",
  cardType = "credito", // 'credito' | 'debito'
  brand = "visa", // 'visa' | 'mastercard' | 'amex' | 'generic'
  cvv = "",
  isFlipped = false,
}) {
  // Format card number with spaces every 4 digits
  const formatCardNumber = (num) => {
    const cleaned = (num || "").replace(/\s+/g, "");
    let res = "";
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) res += " ";
      if (i < cleaned.length) {
        res += cleaned[i];
      } else {
        res += "•";
      }
    }
    return res;
  };

  const detectedBrand = brand?.toLowerCase() || "visa";

  // Dynamic gradients depending on brand & card type
  const getCardBg = () => {
    if (detectedBrand === "visa") {
      return "bg-gradient-to-tr from-[#0d1b2a] via-[#1b263b] to-[#1d4ed8] text-white shadow-blue-950/40";
    }
    if (detectedBrand === "mastercard") {
      return "bg-gradient-to-tr from-[#1a1423] via-[#2d1b36] to-[#c2410c] text-white shadow-amber-950/40";
    }
    if (detectedBrand === "amex") {
      return "bg-gradient-to-tr from-[#003049] via-[#005f73] to-[#0a9396] text-white shadow-cyan-950/40";
    }
    return "bg-gradient-to-tr from-[#111827] via-[#1f2937] to-[#374151] text-white shadow-slate-950/40";
  };

  return (
    <div className="w-full max-w-sm mx-auto perspective-1000 my-4 select-none">
      <div
        className={`relative w-full h-52 sm:h-56 rounded-2xl p-6 transition-all duration-500 shadow-2xl overflow-hidden border border-white/20 backdrop-blur-md ${getCardBg()}`}
      >
        {/* Ambient decorative glowing shapes */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient opacity-20 pointer-events-none" />

        {/* Card Header: Brand & Type */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black text-sm tracking-wider border border-white/25 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
                <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <span className="font-black text-xs tracking-wider uppercase drop-shadow-sm block leading-none">
                {cardType === "debito" ? "Débito" : "Crédito"}
              </span>
              <span className="text-[9px] text-white/70 font-bold tracking-widest uppercase">
                {detectedBrand === "visa" ? "Visa Platinum / Signature" : detectedBrand === "mastercard" ? "Mastercard Black / Gold" : "Tarjeta Internacional"}
              </span>
            </div>
          </div>

          {/* Card Network Logo */}
          <div className="flex items-center">
            {detectedBrand === "visa" ? (
              <div className="flex items-center px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
                <span className="text-lg font-black tracking-wider italic text-white drop-shadow">
                  VISA
                </span>
              </div>
            ) : detectedBrand === "mastercard" ? (
              <div className="flex items-center px-2 py-1 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
                <div className="flex items-center -space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#EB001B] shadow-sm" />
                  <div className="w-6 h-6 rounded-full bg-[#F79E1B] opacity-90 shadow-sm" />
                </div>
              </div>
            ) : detectedBrand === "amex" ? (
              <div className="flex items-center px-2 py-0.5 rounded-lg bg-blue-600 font-black text-xs tracking-tighter text-white border border-white/30">
                AMEX
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
                <span className="text-xs font-black italic">VISA</span>
                <div className="flex items-center -space-x-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* EMV Chip & Contactless & Hologram */}
        <div className="mt-3.5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            {/* Metallic Gold Chip */}
            <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 border border-amber-600/50 shadow-inner flex items-center justify-around px-1 relative overflow-hidden">
              <div className="w-2.5 h-5 border-r border-amber-800/30" />
              <div className="w-2.5 h-5 border-r border-amber-800/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12" />
            </div>

            {/* Contactless Wave */}
            <svg
              className="w-5 h-5 text-white/80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M8.5 16.5a5 5 0 0 1 0-9" />
              <path d="M12 19a8.5 8.5 0 0 0 0-14" />
              <path d="M15.5 21.5a12 12 0 0 0 0-19" />
            </svg>
          </div>

          {/* CVV preview badge */}
          {cvv && (
            <div className="bg-black/30 backdrop-blur-sm px-2.5 py-0.5 rounded-md border border-white/20 text-[10px] font-mono tracking-widest text-slate-200">
              CVV: {cvv.replace(/./g, "•")}
            </div>
          )}
        </div>

        {/* Card Number */}
        <div className="mt-3 relative z-10">
          <div className="font-mono text-base sm:text-lg tracking-[0.2em] font-semibold drop-shadow-md text-slate-50 tabular-nums">
            {formatCardNumber(cardNumber)}
          </div>
        </div>

        {/* Card Footer: Holder & Expiry */}
        <div className="mt-2 pt-1 flex items-end justify-between relative z-10 text-xs">
          <div className="max-w-[70%]">
            <span className="block text-[8px] text-white/70 uppercase tracking-widest font-semibold">
              Titular de la Tarjeta
            </span>
            <span className="font-bold uppercase tracking-wider truncate block text-slate-100 text-xs sm:text-sm drop-shadow-sm">
              {cardHolder.trim() || "NOMBRE Y APELLIDO"}
            </span>
          </div>

          <div className="text-right shrink-0">
            <span className="block text-[8px] text-white/70 uppercase tracking-widest font-semibold">
              Vence
            </span>
            <span className="font-mono font-bold tracking-wider text-slate-100 text-xs sm:text-sm drop-shadow-sm">
              {cardExpiry || "MM/AA"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
