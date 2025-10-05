/**
 * Formats a number to show decimal places only when needed
 * - No decimals if the number is a whole number
 * - Shows up to 2 decimal places if there are non-zero decimal digits
 * @param value The number to format
 * @param maxDecimals Maximum number of decimal places (default: 2)
 */
export function formatSmart(value: number, maxDecimals: number = 2): string {
  // Round to maxDecimals first
  const rounded = Number(value.toFixed(maxDecimals));
  
  // Check if it's effectively a whole number
  if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
    return Math.round(rounded).toString();
  }
  
  // Otherwise, format with up to maxDecimals, removing trailing zeros
  return rounded.toFixed(maxDecimals).replace(/\.?0+$/, '');
}
