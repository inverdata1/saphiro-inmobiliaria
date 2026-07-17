import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend } from "recharts";

export default function EstatusPagoPie({ data }) {
  const safe = (data || []).map((d) => ({
    ...d,
    comision_total_sum: Number(d.comision_total_sum || 0),
  }));

  const total = safe.reduce((acc, x) => acc + x.comision_total_sum, 0);

  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm min-w-0 dark:bg-slate-800 dark:border-slate-700">
      <div className="font-bold mb-3 dark:text-slate-100">Estatus de pago (comisión)</div>

      {total <= 0 ? (
        <div className="h-64 grid place-items-center text-sm text-slate-500 dark:text-slate-400">
          Sin datos en el rango
        </div>
      ) : (
        <div className="h-64 min-h-[256px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={safe}
                dataKey="comision_total_sum"
                nameKey="estatus_pago"
                outerRadius={90}
                label
              />
              <Tooltip formatter={(v) => Number(v).toLocaleString("es-DO")} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}