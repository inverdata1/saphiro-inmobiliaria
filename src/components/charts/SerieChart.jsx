import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import useDarkMode from "../../hooks/useDarkMode";

function fmtPeriodo(p) {
  return String(p).slice(0, 10);
}

export default function SerieChart({ data }) {
  const dark = useDarkMode();
  const tickColor = dark ? "#e2e8f0" : "#334155";
  const tooltipBg = dark ? "#1e293b" : "#fff";
  const tooltipColor = dark ? "#e2e8f0" : "#000";

  const safe = (data || []).map((d) => ({
    ...d,
    monto_total_sum: Number(d.monto_total_sum || 0),
  }));

  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm min-w-0 dark:bg-slate-800 dark:border-slate-700">
      <div className="font-bold mb-3 dark:text-slate-100">Serie (monto total)</div>
      <div className="h-64 min-h-[256px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={safe}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="periodo" tickFormatter={fmtPeriodo} tick={{ fill: tickColor }} />
            <YAxis tick={{ fill: tickColor }} />
            <Tooltip
              contentStyle={{ backgroundColor: tooltipBg, color: tooltipColor }}
              formatter={(value, name) => [Number(value).toLocaleString("es-DO"), name]}
              labelFormatter={(label) => `Periodo: ${fmtPeriodo(label)}`}
            />
            <Line type="monotone" dataKey="monto_total_sum" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}