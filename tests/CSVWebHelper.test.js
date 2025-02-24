import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import CSVWebHelper from '../src/lib/CSVWebHelper.svelte';

// Mock the store module
vi.mock('../src/lib/stores/csvStore', () => {
  const handleFileUpload = vi.fn();
  const handleMaxRowsChange = vi.fn();
  
  // Create mock stores with subscribe methods
  const createMockStore = (initialValue) => {
    let value = initialValue;
    return {
      subscribe: vi.fn((callback) => {
        callback(value);
        return () => {};
      }),
      set: vi.fn((newValue) => {
        value = newValue;
      })
    };
  };

  return {
    handleFileUpload,
    handleMaxRowsChange,
    csvData: createMockStore(null),
    error: createMockStore(''),
    processing: createMockStore(false),
    maxAnalysisRows: createMockStore(100)
  };
});

// Import after mocking
import { csvData, error, processing, maxAnalysisRows, handleFileUpload, handleMaxRowsChange } from '../src/lib/stores/csvStore';

describe('CSVWebHelper Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Reset store values
    csvData.set(null);
    error.set('');
    processing.set(false);
    maxAnalysisRows.set(100);
  });

  it('should render the upload button when no file is loaded', () => {
    const { container } = render(CSVWebHelper);
    
    expect(container.querySelector('.upload-label')).not.toBeNull();
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
  });
  
  it('should call handleFileUpload when a file is selected', async () => {
    const { container } = render(CSVWebHelper);
    
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    
    await fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(handleFileUpload).toHaveBeenCalled();
  });
  
  it('should show error message when error store has value', () => {
    error.set('Test error message');
    
    const { container } = render(CSVWebHelper);
    
    expect(container.querySelector('.error')).not.toBeNull();
    expect(container.querySelector('.error').textContent).toBe('Test error message');
  });
  
  it('should show CSV stats when data is available', () => {
    csvData.set({
      headers: ['name', 'age'],
      columnCount: 2,
      rowCount: 3,
      fileSizeMB: '0.01',
      sampleRows: [['John', '30'], ['Jane', '25'], ['Bob', '45']],
      dataTypes: ['string', 'integer'],
      cardinalities: [3, 3],
      analyzedRows: 3
    });
    
    const { container } = render(CSVWebHelper);
    
    expect(container.querySelector('.stat-card')).not.toBeNull();
    expect(container.textContent).toContain('Rows');
    expect(container.textContent).toContain('Columns');
    expect(container.textContent).toContain('Size');
  });
  
  it('should call handleMaxRowsChange when max rows input changes', async () => {
    csvData.set({
      headers: ['name', 'age'],
      columnCount: 2,
      rowCount: 1000,
      fileSizeMB: '0.05',
      sampleRows: [['John', '30'], ['Jane', '25'], ['Bob', '45']],
      dataTypes: ['string', 'integer'],
      cardinalities: [3, 3],
      analyzedRows: 100,
      rawText: 'name,age\nJohn,30\nJane,25\nBob,45'
    });
    
    const { container } = render(CSVWebHelper);
    
    const input = container.querySelector('#max-rows');
    await fireEvent.input(input, { target: { value: '500' } });
    
    expect(handleMaxRowsChange).toHaveBeenCalled();
  });
});