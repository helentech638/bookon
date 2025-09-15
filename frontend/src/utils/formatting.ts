// Utility functions for safe numeric formatting

/**
 * Safely formats a number to a fixed decimal places
 * @param value - The value to format (can be number, string, or null/undefined)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export const formatNumber = (value: any, decimals: number = 2): string => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value.toFixed(decimals);
  }
  if (typeof value === 'string' && !isNaN(parseFloat(value))) {
    return parseFloat(value).toFixed(decimals);
  }
  return (0).toFixed(decimals);
};

/**
 * Safely formats a price with currency symbol
 * @param value - The price value to format
 * @param currency - Currency symbol (default: '£')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted price string
 */
export const formatPrice = (value: any, currency: string = '£', decimals: number = 2): string => {
  return `${currency}${formatNumber(value, decimals)}`;
};

/**
 * Safely formats a percentage
 * @param value - The percentage value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: any, decimals: number = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};

/**
 * Safely formats an integer
 * @param value - The value to format as integer
 * @returns Formatted integer string
 */
export const formatInteger = (value: any): string => {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.round(value).toString();
  }
  if (typeof value === 'string' && !isNaN(parseInt(value))) {
    return Math.round(parseInt(value)).toString();
  }
  return '0';
};
