import DatePicker, { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";
import "./SaphiroDatePicker.css";

registerLocale("es", es);

const inputClass =
  "block w-full bg-white dark:bg-[#141417] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition";

export default function SaphiroDatePicker(props) {
  return (
    <DatePicker
      dateFormat="dd/MM/yyyy"
      locale="es"
      portalId="datepicker-portal"
      className={inputClass}
      {...props}
    />
  );
}