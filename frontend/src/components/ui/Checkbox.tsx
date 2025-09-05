import React from 'react';
import { cn } from '../../utils/cn';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ 
  className, 
  checked, 
  onCheckedChange, 
  onChange,
  ...props 
}) => (
  <input
    type="checkbox"
    className={cn(
      "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
      className
    )}
    checked={checked}
    onChange={(e) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    }}
    {...props}
  />
);

export { Checkbox };
