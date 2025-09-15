import React from 'react';
import { Card, CardContent } from './Card';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
  mobileLabel?: string;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ComponentType<any>;
  className?: string;
  mobileCardClassName?: string;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  emptyIcon: EmptyIcon,
  className = "",
  mobileCardClassName = ""
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-8">
        {EmptyIcon && <EmptyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />}
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {data.map((row, index) => (
          <Card key={index} className={`bg-white shadow-sm border border-gray-200 ${mobileCardClassName}`}>
            <CardContent className="p-4">
              <div className="space-y-3">
                {columns.map((column) => {
                  const label = column.mobileLabel || column.label;
                  const value = column.render ? column.render(row[column.key], row) : row[column.key];
                  
                  return (
                    <div key={column.key} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-500 capitalize">
                        {label.toLowerCase()}:
                      </span>
                      <div className={`text-sm text-gray-900 text-right flex-1 ml-2 ${column.className || ''}`}>
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveTable;
