import React, { useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { Card, CardContent } from './Card';

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface MobileFiltersProps {
  filters: FilterField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset: () => void;
  onApply: () => void;
  className?: string;
}

const MobileFilters: React.FC<MobileFiltersProps> = ({
  filters,
  values,
  onChange,
  onReset,
  onApply,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const renderFilterField = (field: FilterField) => {
    const value = values[field.key] || '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        );
      
      default:
        return null;
    }
  };

  const activeFiltersCount = Object.values(values).filter(value => value !== '' && value !== null && value !== undefined).length;

  return (
    <div className={className}>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <FunnelIcon className="h-4 w-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Filter Panel */}
      {isOpen && (
        <div className="lg:hidden mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {filters.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    {renderFilterField(field)}
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={onReset}
                  className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Reset
                </Button>
                <Button
                  onClick={() => {
                    onApply();
                    setIsOpen(false);
                  }}
                  className="flex-1 bg-green-600 text-white hover:bg-green-700"
                >
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Desktop Filter Panel */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filters.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  {renderFilterField(field)}
                </div>
              ))}
            </div>
            
            <div className="flex space-x-3 mt-4">
              <Button
                onClick={onReset}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Reset
              </Button>
              <Button
                onClick={onApply}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileFilters;
