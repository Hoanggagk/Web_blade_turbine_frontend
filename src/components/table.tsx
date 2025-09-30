import React from "react";
import "../components styles/table.css";

export type Align = "left" | "center" | "right";

export type Column<T> = {
  key: string;
  header: string | React.ReactNode;
  size?: number;
  align?: Align;
  headerClassName?: string;
  className?: string;
  headerRender?: () => React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | null | undefined;
};

export type GenericTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  onRowKeyDown?: (e: React.KeyboardEvent, row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string | undefined;
  rowProps?: (row: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
  cellProps?: (row: T, col: Column<T>, index: number) => React.TdHTMLAttributes<HTMLTableCellElement>;
  loading?: boolean;
  emptyText?: string;
  getRowKey?: (row: T, index: number) => React.Key;
  stickyHeader?: boolean;
  cellAutoTooltip?: boolean;
  enableSelection?: boolean;
  selectedRowIds?: Set<React.Key>;
  onSelectionChange?: (ids: Set<React.Key>) => void;
  getSelectionKey?: (row: T, index: number) => React.Key;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  activateOnKeyboard?: boolean;
};

/* =========================
   Table Manager (đã tối giản)
   ========================= */
class TableManager<T> {
  private columns: Column<T>[];
  private getRowKey?: (row: T, index: number) => React.Key;
  private getSelectionKey?: (row: T, index: number) => React.Key;

  constructor(
    _data: T[], // không cần lưu
    columns: Column<T>[],
    getRowKey?: (row: T, index: number) => React.Key,
    getSelectionKey?: (row: T, index: number) => React.Key
  ) {
    this.columns = columns;
    this.getRowKey = getRowKey;
    this.getSelectionKey = getSelectionKey;
  }

  getKey(row: T, index: number): React.Key {
    return this.getRowKey?.(row, index) ?? (row as any).id ?? index;
  }
  getSelKey(row: T, index: number): React.Key {
    return this.getSelectionKey?.(row, index) ?? this.getKey(row, index);
  }

  sort(data: T[], sortKey?: string, sortDir?: "asc" | "desc"): T[] {
    if (!sortKey || !sortDir) return data;
    const col = this.columns.find((c) => c.key === sortKey);
    if (!col) return data;
    const acc = col.sortAccessor ?? ((r: any) => r[sortKey]);
    return [...data].sort((a, b) => {
      const va = acc(a);
      const vb = acc(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  getTotalPages(pageSize?: number, total?: number): number {
    if (!pageSize || total == null) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }
}

/* =========================
   GenericTable Component
   ========================= */
function GenericTable<T extends { id?: string }>({
  data,
  columns,
  onRowClick,
  onRowDoubleClick,
  onRowKeyDown,
  rowClassName,
  rowProps,
  cellProps,
  loading,
  emptyText = "No data found.",
  getRowKey,
  stickyHeader = false,
  cellAutoTooltip = true,
  enableSelection = false,
  selectedRowIds,
  onSelectionChange,
  getSelectionKey,
  page,
  pageSize,
  total,
  onPageChange,
  activateOnKeyboard = true,
}: GenericTableProps<T>) {
  const [sortState, setSortState] = React.useState<{ key?: string; dir?: "asc" | "desc" }>({});
  const manager = React.useMemo(() => new TableManager<T>(data, columns, getRowKey, getSelectionKey), [
    data,
    columns,
    getRowKey,
    getSelectionKey,
  ]);

  const sorted = manager.sort(data, sortState.key, sortState.dir);

  // Selection
  const selectionIds = selectedRowIds ?? new Set<React.Key>();
  const allKeys = enableSelection ? sorted.map((r, i) => manager.getSelKey(r, i)) : [];
  const allChecked = allKeys.length > 0 && allKeys.every((k) => selectionIds.has(k));
  const indeterminate = allKeys.some((k) => selectionIds.has(k)) && !allChecked;

  const handleToggleAll = () => {
    if (!enableSelection || !onSelectionChange) return;
    const next = new Set(selectionIds);
    if (allChecked) allKeys.forEach((k) => next.delete(k));
    else allKeys.forEach((k) => next.add(k));
    onSelectionChange(next);
  };

  const handleToggleOne = (key: React.Key) => {
    if (!enableSelection || !onSelectionChange) return;
    const next = new Set(selectionIds);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange(next);
  };

  // Pagination
  const totalPages = manager.getTotalPages(pageSize, total);
  const showPagination =
    typeof page === "number" &&
    typeof pageSize === "number" &&
    typeof total === "number" &&
    onPageChange &&
    totalPages > 1;

  // Sort
  const toggleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    setSortState((s) => {
      if (s.key !== col.key) return { key: col.key, dir: "asc" };
      return { key: col.key, dir: s.dir === "asc" ? "desc" : "asc" };
    });
  };

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table className={`user-table${stickyHeader ? " user-table--sticky" : ""}`}>
          <thead>
            <tr>
              {enableSelection && (
                <th className="th-select">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = indeterminate;
                    }}
                    onChange={handleToggleAll}
                  />
                </th>
              )}
              {columns.map((col) => {
                const isActive = sortState.key === col.key;
                const arrow = isActive ? (sortState.dir === "asc" ? " ▲" : " ▼") : "";
                return (
                  <th
                    key={col.key}
                    className={col.headerClassName ?? col.className}
                    style={{
                      ...(col.size ? { width: `${col.size * 100}%` } : {}),
                      ...(col.align ? { textAlign: col.align } : {}),
                      cursor: col.sortable ? "pointer" : undefined,
                    }}
                    onClick={() => toggleSort(col)}
                  >
                    {col.headerRender ? col.headerRender() : col.header}
                    {col.sortable && <span className="sort-arrow">{arrow}</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={(enableSelection ? 1 : 0) + columns.length} className="no-data">
                  Loading…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={(enableSelection ? 1 : 0) + columns.length} className="no-data">
                  {emptyText}
                </td>
              </tr>
            ) : (
              sorted.map((row, index) => {
                const key = manager.getKey(row, index);
                const selKey = enableSelection ? manager.getSelKey(row, index) : undefined;
                const checked = selKey ? selectionIds.has(selKey) : false;

                return (
                  <tr
                    key={key}
                    className={`table-row ${rowClassName?.(row, index) || ""}`}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                    onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row, index) : undefined}
                    onKeyDown={
                      onRowKeyDown
                        ? (e) => onRowKeyDown(e, row, index)
                        : onRowClick && activateOnKeyboard
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") onRowClick(row, index);
                          }
                        : undefined
                    }
                    {...(rowProps?.(row, index) ?? {})}
                  >
                    {enableSelection && (
                      <td className="td-select" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={checked} onChange={() => selKey && handleToggleOne(selKey)} />
                      </td>
                    )}
                    {columns.map((col) => {
                      const cp = cellProps?.(row, col, index) ?? {};
                      const content = col.render ? col.render(row, index) : (row as any)[col.key];
                      if (cellAutoTooltip && (typeof content === "string" || typeof content === "number") && cp.title == null) {
                        cp.title = String(content);
                      }
                      return (
                        <td key={col.key} className={col.className} style={{ textAlign: col.align }} {...cp}>
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="table-pagination">
          <button className="btn-plain" onClick={() => onPageChange!(1)} disabled={page <= 1}>
            ⏮ First
          </button>
          <button className="btn-plain" onClick={() => onPageChange!(page - 1)} disabled={page <= 1}>
            ◀ Prev
          </button>
          <span className="page-info">
            Page {page} / {totalPages} • Showing{" "}
            {Math.min((page - 1) * pageSize! + 1, total!)}–
            {Math.min(page * pageSize!, total!)} of {total}
          </span>
          <button className="btn-plain" onClick={() => onPageChange!(page + 1)} disabled={page >= totalPages}>
            Next ▶
          </button>
          <button className="btn-plain" onClick={() => onPageChange!(totalPages)} disabled={page >= totalPages}>
            Last ⏭
          </button>
        </div>
      )}
    </div>
  );
}

export default GenericTable;
