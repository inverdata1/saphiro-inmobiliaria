export default function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="px-4 py-3 text-center text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {rows?.length ? (
            rows.map((r, idx) => (
              <tr key={r.id ?? idx} className="hover:bg-blue-50 dark:hover:bg-blue-900/30">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 text-sm text-center text-slate-700 dark:text-slate-300 ${c.className || ""}`}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-6 text-sm text-center text-slate-500 dark:text-slate-400" colSpan={columns.length}>
                Sin datos
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}