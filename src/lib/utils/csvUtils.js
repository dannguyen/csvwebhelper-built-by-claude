/**
 * Infers the data type of a given value
 * @param {string} value - The value to analyze
 * @returns {string} The inferred data type
 */
export function inferDataType(value) {
  if (value === '' || value === null || value === undefined) return 'empty';
  
  // Special cases that JavaScript considers as numbers but we want as strings
  if (value === 'Infinity' || value === '-Infinity' || value === 'NaN') {
    return 'string';
  }
  
  // Check if it's a number
  if (!isNaN(value) && !isNaN(parseFloat(value))) {
    // Check if it's an integer
    if (Number.isInteger(parseFloat(value))) return 'integer';
    return 'float';
  }
  
  // Check if it's a date
  const dateRegex = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/;
  if (dateRegex.test(value)) return 'date';
  
  // Check if it's a boolean
  const boolValues = ['true', 'false', 'yes', 'no', '0', '1'];
  if (boolValues.includes(value.toLowerCase())) return 'boolean';
  
  // Default to string
  return 'string';
}

/**
 * Calculates the cardinality (number of unique values) in an array
 * @param {Array} values - The array of values to analyze
 * @returns {number} The number of unique values
 */
export function calculateCardinality(values) {
  // Count unique values
  const uniqueValues = new Set(values);
  return uniqueValues.size;
}