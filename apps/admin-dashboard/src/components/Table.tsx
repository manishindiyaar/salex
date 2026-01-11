import React from 'react';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

export const Table = React.forwardRef<HTMLDivElement, TableProps<any>>(
  ({ columns, data, isLoading = false, onRowClick, className = '' }, ref) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-salex-xl">
          <div className="animate-spin">
            <svg className="w-8 h-8 text-salex-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center py-salex-xl">
          <p className="text-salex-secondary">No data available</p>
        </div>
      );
    }

    return (
      <div ref={ref} className={`overflow-x-auto ${className}`}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-salex-gray-border">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-salex-md py-salex-md text-left text-salex-sm font-salex-bold text-salex-secondary"
                  style={{ width: col.width }}
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
                className={`border-b border-salex-gray-border hover:bg-salex-black-lighter transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="px-salex-md py-salex-md text-salex-sm text-salex-white"
                  >
                    {col.render ? col.render(row[col.key], row) : String(row[col.key])}
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
