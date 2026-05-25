import React from 'react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
}

export const Table = React.forwardRef<HTMLDivElement, TableProps<any>>(
  ({ columns, data, isLoading = false, onRowClick, className = '', emptyMessage }, ref) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div
              className="spinner"
              style={{ width: 24, height: 24 }}
            />
            <p className="text-[12px] font-mono uppercase tracking-wide" style={{ color: '#A8A6B0' }}>
              Loading…
            </p>
          </div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <p className="font-serif text-[18px]" style={{ color: '#C9C7CF' }}>
            Nothing here yet
          </p>
          <p className="text-[12px]" style={{ color: '#A8A6B0' }}>
            {emptyMessage ?? 'No records found'}
          </p>
        </div>
      );
    }

    return (
      <div ref={ref} className={`overflow-x-auto ${className}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E4E3' }}>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left"
                  style={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#A8A6B0',
                    width: col.width,
                    textAlign: col.align ?? 'left',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className="transition-colors duration-100"
                style={{
                  borderBottom: '1px solid #F0EFEE',
                  cursor: onRowClick ? 'pointer' : 'default',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) (e.currentTarget as HTMLTableRowElement).style.background = '#FAFAF9';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                }}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="px-4 py-3.5 text-[13px]"
                    style={{
                      color: '#03031F',
                      textAlign: col.align ?? 'left',
                      verticalAlign: 'middle',
                    }}
                  >
                    {col.render
                      ? col.render(row[col.key as keyof typeof row], row)
                      : String(row[col.key as keyof typeof row] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';
