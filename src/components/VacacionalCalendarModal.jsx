import { useEffect, useState } from "react";
import Calendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import esLocale from "@fullcalendar/core/locales/es";
import { reservasToEvents } from "../utils/reservas";

function getCalHeight() {
  const vh = Math.round(window.innerHeight * 0.96);
  return Math.max(280, vh - 110);
}

export default function VacacionalCalendarModal({ open, onClose, titulo, reservas }) {
  const [calHeight, setCalHeight] = useState(0);

  useEffect(() => {
    if (!open) return;
    const update = () => setCalHeight(getCalHeight());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[96vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl dark:bg-slate-800 dark:border dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-3 sm:p-4 pb-0">
          <div className="pr-2">
            <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
              Calendario de disponibilidad
            </div>
            <div className="mt-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {titulo || "Selecciona fechas para tu estadía vacacional"}
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

        <div className="calendar-saphiro overflow-hidden p-2 sm:p-2.5 text-[12px]">
          <Calendar
            plugins={[dayGridPlugin]}
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
            initialDate={new Date().toISOString().slice(0, 10)}
            validRange={{
              start: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`,
              end: `${new Date().getFullYear() + 2}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`,
            }}
          />
        </div>

        <p className="px-3 sm:px-4 pb-3 sm:pb-4 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
          Consulta la disponibilidad de fechas con el corredor asignado antes de reservar.
        </p>
      </div>
    </div>
  );
}