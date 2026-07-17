import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import useDarkMode from "../../hooks/useDarkMode";

export default function TopCorredoresBar({ data }) {
  const dark = useDarkMode();
  const tickColor = dark ? "#e2e8f0" : "#334155";
  const tooltipBg = dark ? "#1e293b" : "#fff";
  const tooltipColor = dark ? "#e2e8f0" : "#000";

  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm min-w-0 dark:bg-slate-800 dark:border-slate-700">
      <div className="font-bold mb-3 dark:text-slate-100">(comisión total)</div>
      <div className="h-64 min-h-[256px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="corredor_nombre" tick={{ fill: tickColor }} />
            <YAxis tick={{ fill: tickColor }} />
            <Tooltip
              contentStyle={{ backgroundColor: tooltipBg, color: tooltipColor }}
              formatter={(value) => Number(value).toLocaleString("es-DO")}
            />
            <Bar dataKey="comision_total_sum" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}