import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Calendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { reservasToEvents, fechasOcupadas } from "../utils/reservas";

function getCalHeight() {
  const vh = Math.round(window.innerHeight * 0.96);
  return Math.max(260, vh - 120);
}

function toYMD(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLong(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function DatePickerCalendarModal({
  open,
  onClose,
  onSelect,
  selectedDate,
  minDate,
  maxDate,
  title = "Selecciona una fecha",
  subtitle,
  reservas,
}) {
  const [calHeight, setCalHeight] = useState(0);
  const calendarRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const update = () => setCalHeight(getCalHeight());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  const ocupadas = useMemo(() => fechasOcupadas(reservas), [reservas]);

  const handleDateClick = useCallback(
    (info) => {
      const clickedDate = info.dateStr;
      const min = minDate || toYMD(new Date());
      if (clickedDate < min) return;
      if (maxDate && clickedDate > maxDate) return;
      if (ocupadas.has(clickedDate)) return;
      onSelect(clickedDate);
      onClose();
    },
    [onSelect, onClose, minDate, maxDate, ocupadas]
  );

  if (!open) return null;

  const validRange = {
    start: minDate || toYMD(new Date()),
    end: maxDate
      ? toYMD(new Date(new Date(maxDate).getTime() + 86400000))
      : `${new Date().getFullYear() + 2}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-[fadein_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[96vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl dark:bg-slate-800 dark:border dark:border-slate-700 animate-[slideup_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-3 sm:p-4 pb-0">
          <div className="pr-2 min-w-0">
            <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </div>
            <div className="mt-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {subtitle || "Haz clic en una fecha para seleccionarla"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 cursor-pointer shrink-0"
            aria-label="Cerrar calendario"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {selectedDate && (
          <div className="px-3 sm:px-4 pt-2 pb-1">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
              </svg>
              {formatDateLong(selectedDate)}
            </div>
          </div>
        )}

        <div className="calendar-saphiro overflow-hidden px-1 sm:px-2.5 py-2 sm:py-2.5 text-[11px] sm:text-[12px]">
          <Calendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            events={reservasToEvents(reservas)}
            eventDisplay="block"
            initialView="dayGridMonth"
            locale="es"
            locales={[esLocale]}
            height={calHeight}
            fixedWeekCount={false}
            showNonCurrentDates={false}
            dayMaxEvents={true}
            weekends={true}
            todayHighlight={true}
            firstDay={1}
            headerToolbar={{
              left: "prev,next",
              center: "title",
            }}
            initialDate={selectedDate || new Date().toISOString().slice(0, 10)}
            validRange={validRange}
            dateClick={handleDateClick}
            dayCellClassNames={(arg) => {
              const classes = [];
              const dateStr = arg.dateStr;
              const today = toYMD(new Date());

              if (dateStr === today) {
                classes.push("fc-day-today");
              }

              if (selectedDate && dateStr === selectedDate) {
                classes.push("fc-date-selected");
              }

              return classes;
            }}
          />
        </div>

        <div className="px-3 sm:px-4 pb-4 sm:pb-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700 pt-3">
          <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 min-w-0 truncate">
            Selecciona la fecha de{" "}
            {subtitle?.includes("llegas") ? "entrada" : subtitle?.includes("vas") ? "salida" : "tu reserva"}.
          </p>
          {selectedDate && (
            <button
              type="button"
              onClick={() => {
                onSelect(selectedDate);
                onClose();
              }}
              className="shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 transition-colors cursor-pointer"
            >
              Confirmar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


