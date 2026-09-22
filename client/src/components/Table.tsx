import type { ReactNode } from "react";

// Componente GENÉRICO: el <T> es un "tipo variable" — este mismo Table sirve para
// UserDto, RoleDto o lo que sea, y TypeScript sabe exactamente qué campos tiene
// "row" en cada columna porque se lo pasas como parámetro de tipo (Table<UserDto>).
interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
}

export function Table<T>({ columns, rows, getRowKey, emptyMessage = "No hay datos para mostrar." }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/70 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.header} className="px-4 py-3 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)} className="transition-colors hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td key={column.header} className="px-4 py-3">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
