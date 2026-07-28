import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';

// ============================================================
// Column definition type
// ============================================================
export interface ColumnDef<T> {
  key: string;
  header: string;
  visible?: boolean;           // shown in main row (true) or only in expanded panel (false)
  align?: 'left' | 'right' | 'center';
  render: (row: T) => React.ReactNode;
}

interface DataListProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  extraColumns?: ColumnDef<T>[];  // columns shown only when row is expanded
  rowKey: (row: T) => string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  emptyMessage?: string;
}

// ============================================================
// DataList — Expandable Row List Component
// ============================================================
export function DataList<T>({
  data,
  columns,
  extraColumns = [],
  rowKey,
  onEdit,
  onDelete,
  emptyMessage = 'Nenhum registro encontrado.',
}: DataListProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const mainCols = columns.filter(c => c.visible !== false);
  const hasExtras = extraColumns.length > 0;
  const hasActions = !!(onEdit || onDelete);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* ── HEADER ── */}
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950/60 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              {hasExtras && <th className="w-9 py-3 pl-3" />}
              {mainCols.map(col => (
                <th
                  key={col.key}
                  className={`py-3.5 px-4 font-semibold ${
                    col.align === 'right' ? 'text-right' :
                    col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
              {hasActions && (
                <th className="py-3.5 px-4 font-semibold text-center w-24">Ações</th>
              )}
            </tr>
          </thead>

          {/* ── BODY ── */}
          <tbody className="divide-y divide-neutral-800/50 text-sm text-neutral-300">
            {data.length > 0 ? (
              data.map(row => {
                const id = rowKey(row);
                const isExpanded = expandedRows.has(id);

                return (
                  <React.Fragment key={id}>
                    {/* ── MAIN ROW ── */}
                    <tr
                      className={`transition-colors ${isExpanded ? 'bg-neutral-800/30' : 'hover:bg-neutral-800/20'}`}
                      id={`data-list-row-${id}`}
                    >
                      {/* Expand toggle */}
                      {hasExtras && (
                        <td className="pl-3 py-3">
                          <button
                            onClick={() => toggleRow(id)}
                            className="p-1 text-neutral-500 hover:text-orange-400 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                            title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                            aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      )}

                      {mainCols.map(col => (
                        <td
                          key={col.key}
                          className={`py-3.5 px-4 ${
                            col.align === 'right' ? 'text-right' :
                            col.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          {col.render(row)}
                        </td>
                      ))}

                      {hasActions && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(row)}
                                className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Editar"
                                aria-label="Editar registro"
                                id={`edit-row-btn-${id}`}
                              >
                                <Edit size={14} />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(row)}
                                className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                title="Excluir"
                                aria-label="Excluir registro"
                                id={`delete-row-btn-${id}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* ── EXPANDED DETAIL PANEL ── */}
                    {hasExtras && isExpanded && (
                      <tr className="bg-neutral-950/40">
                        <td
                          colSpan={mainCols.length + (hasActions ? 2 : 1)}
                          className="px-4 py-3 border-t border-neutral-800/40"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-mono">
                            {extraColumns.map(col => (
                              <div key={col.key} className="space-y-1">
                                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                                  {col.header}
                                </p>
                                <div className="text-neutral-300">
                                  {col.render(row)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={mainCols.length + (hasExtras ? 1 : 0) + (hasActions ? 1 : 0)}
                  className="py-16 text-center text-neutral-500 font-mono text-xs"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER SUMMARY ── */}
      {data.length > 0 && (
        <div className="px-4 py-2.5 border-t border-neutral-800/60 bg-neutral-950/40 text-[11px] font-mono text-neutral-500 flex items-center justify-between">
          <span>{data.length} registro{data.length !== 1 ? 's' : ''}</span>
          {hasExtras && (
            <span className="text-neutral-600 text-[10px]">
              ▸ Clique em ‹›› para ver campos adicionais
            </span>
          )}
        </div>
      )}
    </div>
  );
}
