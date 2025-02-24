import { writable } from 'svelte/store';
import { inferDataType, calculateCardinality } from '../utils/csvUtils';

// For improved testability, export functions directly

// Create writable stores
export const csvData = writable(null);
export const error = writable('');
export const processing = writable(false);
export const maxAnalysisRows = writable(100);

// Parse CSV function
export function parseCSV(text, fileSizeMB = '0.00', maxRows, originalFilename = 'data') {
  // Simple CSV parser
  const lines = text.split(/\r\n|\n/);
  if (lines.length === 0) {
    error.set('CSV file is empty');
    return;
  }
  
  // Detect delimiter (comma, semicolon, tab)
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes(';')) delimiter = ';';
  else if (firstLine.includes('\t')) delimiter = '\t';
  
  // Get headers
  const headers = lines[0].split(delimiter).map(header => header.trim().replace(/^"|"$/g, ''));
  const columnCount = headers.length;
  
  // Process data rows
  const rows = [];
  // Save all rows for total count, but limit processing for analysis
  const allRows = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    // Handle quoted fields with commas correctly
    let row = [];
    let fieldBuffer = '';
    let inQuotes = false;
    
    for (let char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        row.push(fieldBuffer.trim());
        fieldBuffer = '';
      } else {
        fieldBuffer += char;
      }
    }
    
    if (fieldBuffer) {
      row.push(fieldBuffer.trim());
    }
    
    allRows.push(row);
    
    // Only add to analysis rows if under limit
    if (i <= maxRows) {
      rows.push(row);
    }
  }
  
  // Infer data types for each column
  const dataTypes = [];
  const cardinalities = [];
  
  for (let i = 0; i < headers.length; i++) {
    const columnValues = rows.filter(row => row.length > i).map(row => row[i]);
    if (columnValues.length === 0) {
      dataTypes.push('unknown');
      cardinalities.push(0);
      continue;
    }
    
    // Get the most common data type
    const typeCount = {};
    columnValues.forEach(value => {
      const type = inferDataType(value);
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    let mostCommonType = 'string';
    let maxCount = 0;
    for (const type in typeCount) {
      if (typeCount[type] > maxCount) {
        maxCount = typeCount[type];
        mostCommonType = type;
      }
    }
    
    dataTypes.push(mostCommonType);
    
    // Calculate cardinality (number of unique values)
    cardinalities.push(calculateCardinality(columnValues));
  }
  
  csvData.set({
    headers: headers,
    columnCount: columnCount,
    rowCount: allRows.length,
    fileSizeMB: fileSizeMB,
    sampleRows: allRows.slice(0, 3),
    dataTypes: dataTypes,
    cardinalities: cardinalities,
    analyzedRows: Math.min(maxRows, allRows.length),
    rawText: text,
    delimiter: delimiter,
    originalFilename: originalFilename
  });
}

// Function to handle file uploads
export function handleFileUpload(event) {
  let maxRows;
  maxAnalysisRows.subscribe(value => maxRows = value)();
  
  const file = event.target.files[0];
  if (!file) return;
  
  // Get the original filename without extension for later use
  const originalFilename = file.name.replace(/\.[^/.]+$/, '');
  
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    error.set('Please upload a CSV file');
    csvData.set(null);
    return;
  }
  
  error.set('');
  processing.set(true);
  
  // Calculate file size in MB
  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const text = e.target.result;
      parseCSV(text, fileSizeMB, maxRows, originalFilename);
    } catch (err) {
      error.set('Error parsing CSV: ' + err.message);
      csvData.set(null);
    } finally {
      processing.set(false);
    }
  };
  
  reader.onerror = function() {
    error.set('Error reading file');
    csvData.set(null);
    processing.set(false);
  };
  
  reader.readAsText(file);
}

// Function to handle max rows change
export function handleMaxRowsChange(value) {
  // Ensure the value is at least 10
  const newMaxRows = Math.max(10, value);
  maxAnalysisRows.set(newMaxRows);
  
  // Re-process current data if available
  let currentData;
  csvData.subscribe(value => currentData = value)();
  
  if (currentData && currentData.rawText) {
    // Show processing state
    processing.set(true);
    
    // Use setTimeout to allow UI to update before processing
    setTimeout(() => {
      parseCSV(currentData.rawText, currentData.fileSizeMB, newMaxRows, currentData.originalFilename);
      processing.set(false);
    }, 0);
  }
}