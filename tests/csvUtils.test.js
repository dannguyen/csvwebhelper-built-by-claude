import { describe, it, expect } from 'vitest';
import { inferDataType, calculateCardinality } from '../src/lib/utils/csvUtils';

describe('inferDataType', () => {
  // Test empty values
  it('should identify empty values correctly', () => {
    expect(inferDataType('')).toBe('empty');
    expect(inferDataType(null)).toBe('empty');
    expect(inferDataType(undefined)).toBe('empty');
  });

  // Test integers
  it('should identify integers correctly', () => {
    expect(inferDataType('0')).toBe('integer');
    expect(inferDataType('42')).toBe('integer');
    expect(inferDataType('-273')).toBe('integer');
    expect(inferDataType('1000000')).toBe('integer');
  });

  // Test floating point numbers
  it('should identify floating point numbers correctly', () => {
    expect(inferDataType('3.14')).toBe('float');
    expect(inferDataType('-0.5')).toBe('float');
    expect(inferDataType('1.0')).toBe('float');
    expect(inferDataType('6.02e23')).toBe('float');
  });

  // Test dates
  it('should identify dates correctly', () => {
    expect(inferDataType('2023-02-24')).toBe('date');
    expect(inferDataType('02/24/2023')).toBe('date');
    expect(inferDataType('24-02-2023')).toBe('date');
    expect(inferDataType('2/24/23')).toBe('date');
  });

  // Test booleans
  it('should identify boolean values correctly', () => {
    expect(inferDataType('true')).toBe('boolean');
    expect(inferDataType('false')).toBe('boolean');
    expect(inferDataType('yes')).toBe('boolean');
    expect(inferDataType('no')).toBe('boolean');
    expect(inferDataType('0')).toBe('integer'); // Note: ambiguous case treated as integer
    expect(inferDataType('1')).toBe('integer'); // Note: ambiguous case treated as integer
    expect(inferDataType('TRUE')).toBe('boolean');
    expect(inferDataType('FALSE')).toBe('boolean');
  });

  // Test strings
  it('should identify strings correctly', () => {
    expect(inferDataType('hello')).toBe('string');
    expect(inferDataType('user@example.com')).toBe('string');
    expect(inferDataType('Alpha-123')).toBe('string');
    expect(inferDataType('P@$$w0rd')).toBe('string');
  });

  // Test edge cases
  it('should handle edge cases correctly', () => {
    expect(inferDataType('NaN')).toBe('string');
    expect(inferDataType('Infinity')).toBe('string');
    expect(inferDataType('null')).toBe('string');
    expect(inferDataType('undefined')).toBe('string');
    expect(inferDataType('Not a Number')).toBe('string');
  });
});

describe('calculateCardinality', () => {
  it('should return 0 for empty arrays', () => {
    expect(calculateCardinality([])).toBe(0);
  });

  it('should correctly count unique values', () => {
    expect(calculateCardinality(['a', 'b', 'c'])).toBe(3);
    expect(calculateCardinality(['a', 'a', 'b', 'c', 'c'])).toBe(3);
    expect(calculateCardinality([1, 2, 3, 3, 2, 1])).toBe(3);
  });

  it('should handle arrays with mixed types', () => {
    expect(calculateCardinality(['1', 1, 'a', true])).toBe(4);
  });

  it('should handle arrays with undefined and null', () => {
    expect(calculateCardinality([undefined, null, '', 0])).toBe(4);
  });

  it('should handle large arrays efficiently', () => {
    const largeArray = Array.from({ length: 10000 }, (_, i) => i % 100);
    expect(calculateCardinality(largeArray)).toBe(100);
  });
});