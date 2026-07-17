export default function KpiCard({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-1.5 text-xs text-slate-500 dark:text-slate-400">{title}</div>
      <div className="text-[22px] font-bold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}