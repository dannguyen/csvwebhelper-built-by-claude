import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { csvData, error, processing, maxAnalysisRows, parseCSV } from '../src/lib/stores/csvStore';
import * as csvUtils from '../src/lib/utils/csvUtils';

// Mock the csvUtils to avoid dependency issues
vi.mock('../src/lib/utils/csvUtils', () => ({
  inferDataType: vi.fn(value => {
    if (value === '' || value === null || value === undefined) return 'empty';
    if (value === 'Infinity' || value === '-Infinity' || value === 'NaN') return 'string';
    if (!isNaN(value) && value.indexOf && value.indexOf('.') === -1) return 'integer';
    if (!isNaN(value)) return 'float';
    if (/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/.test(value)) return 'date';
    if (['true', 'false', 'yes', 'no'].includes(value && value.toLowerCase ? value.toLowerCase() : value)) return 'boolean';
    return 'string';
  }),
  calculateCardinality: vi.fn(values => new Set(values).size)
}));

// Mock window.File and FileReader
class MockFileReader {
  constructor() {
    this.result = null;
    this.onload = null;
    this.onerror = null;
  }

  readAsText(file) {
    if (file && file.shouldFail) {
      this.onerror && this.onerror(new Error('Mock file read error'));
    } else if (file && file.content) {
      this.result = file.content;
      this.onload && this.onload({ target: { result: this.result } });
    } else {
      // Default behavior for tests that don't set up the file content
      this.result = 'name,age\nJohn,30\nJane,25';
      this.onload && this.onload({ target: { result: this.result } });
    }
  }
}

// Mock File
global.File = class MockFile {
  constructor(bits, name, options = {}) {
    this.name = name;
    this.type = options.type || '';
    this.size = bits.join('').length;
    this.content = bits.join('');
    this.shouldFail = options.shouldFail || false;
  }
};

// Setup for tests
beforeEach(() => {
  // Reset store states by calling the set method on each store
  csvData.set(null);
  error.set('');
  processing.set(false);
  maxAnalysisRows.set(100);
  
  // Set up mocks
  global.FileReader = MockFileReader;
  
  // Reset mocks
  vi.clearAllMocks();
});

describe('parseCSV', () => {
  it('should correctly parse a simple CSV', () => {
    const csvText = 'name,age,city\nJohn,30,New York\nJane,25,Boston\nBob,45,Chicago';
    parseCSV(csvText, '0.01', 100);
    
    const data = get(csvData);
    
    expect(data).not.toBeNull();
    expect(data.headers).toEqual(['name', 'age', 'city']);
    expect(data.columnCount).toBe(3);
    expect(data.rowCount).toBe(3);
    expect(data.fileSizeMB).toBe('0.01');
    expect(data.dataTypes).toEqual(['string', 'integer', 'string']);
    expect(data.cardinalities).toEqual([3, 3, 3]);
    expect(data.analyzedRows).toBe(3);
  });

  it('should handle empty CSV', () => {
    parseCSV('', '0.00', 100);
    expect(get(error)).toBe('CSV file is empty');
    expect(get(csvData)).toBeNull();
  });

  it('should automatically detect semicolon delimiter', () => {
    const csvText = 'name;age;city\nJohn;30;New York\nJane;25;Boston';
    parseCSV(csvText, '0.01', 100);
    
    const data = get(csvData);
    expect(data.headers).toEqual(['name', 'age', 'city']);
    expect(data.rowCount).toBe(2);
  });

  it('should respect maxRows parameter', () => {
    const csvText = 'name,age,city\nJohn,30,New York\nJane,25,Boston\nBob,45,Chicago\nAlice,35,Seattle';
    parseCSV(csvText, '0.01', 2);
    
    const data = get(csvData);
    expect(data.rowCount).toBe(4); // All rows are counted
    expect(data.analyzedRows).toBe(2); // But only 2 are analyzed
  });

  it('should handle quoted fields with commas', () => {
    const csvText = 'name,description,city\nJohn,"Developer, senior",New York\nJane,"Manager, HR",Boston';
    parseCSV(csvText, '0.01', 100);
    
    const data = get(csvData);
    expect(data.sampleRows[0][1]).toBe('Developer, senior');
  });
});

describe('Data type inference in parsing', () => {
  it('should correctly infer data types for columns', () => {
    const csvText = 'integer,float,date,boolean,string\n1,1.5,2023-02-24,true,hello\n2,2.5,2023/02/25,false,world';
    parseCSV(csvText, '0.01', 100);
    
    const data = get(csvData);
    expect(data.dataTypes).toEqual(['integer', 'float', 'date', 'boolean', 'string']);
  });

  it('should calculate correct cardinality for columns', () => {
    const csvText = 'id,category,value\n1,A,10\n2,A,20\n3,B,10\n4,C,30\n5,B,40';
    parseCSV(csvText, '0.01', 100);
    
    const data = get(csvData);
    expect(data.cardinalities).toEqual([5, 3, 4]); // 5 unique ids, 3 categories (A,B,C), 4 values (10,20,30,40)
  });
});