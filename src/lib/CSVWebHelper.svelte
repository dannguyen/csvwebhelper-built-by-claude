<script>
  import { onMount } from 'svelte';
  import {
    csvData,
    error,
    processing,
    maxAnalysisRows,
    handleFileUpload,
    handleMaxRowsChange
  } from './stores/csvStore';

  // Local variable for input binding
  let maxRows;

  // Data Loader variables
  let selectedColumns = Array(5).fill(null); // Array of 5 possible column selections
  let currentPage = 1;
  const rowsPerPage =  50;
  let allRows = [];
  let paginatedRows = [];
  let filteredRowsCount = 0;
  let totalPages = 1;

  // Subscribe to maxAnalysisRows store
  onMount(() => {
    const unsubscribe = maxAnalysisRows.subscribe(value => {
      maxRows = value;
    });

    return unsubscribe;
  });

  // Handle input changes
  function onMaxRowsInput() {
    handleMaxRowsChange(maxRows);
  }

  // Update the paginated rows whenever the currentPage or selectedColumns change
  $: if ($csvData) {
    if (!allRows.length) {
      // Parse all rows if we haven't already
      allRows = getAllRows($csvData.rawText);
    }

    filteredRowsCount = allRows.length;
    totalPages = Math.ceil(filteredRowsCount / rowsPerPage);

    // Get the rows for the current page
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredRowsCount);
    paginatedRows = allRows.slice(startIndex, endIndex);
  }

  // Function to handle column selection change
  function handleColumnChange(index, value) {
    // Update the column at the specified index
    selectedColumns[index] = value === "" ? null : parseInt(value);
    selectedColumns = [...selectedColumns]; // Trigger reactivity
    currentPage = 1; // Reset pagination
  }

  // Function to get all rows from the CSV data
  function getAllRows(csvText) {
    if (!csvText) return [];

    // Extract the text and split into lines
    const lines = csvText.split(/\r\n|\n/);
    if (lines.length <= 1) return [];

    // Determine the delimiter
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes(';')) delimiter = ';';
    else if (firstLine.includes('\t')) delimiter = '\t';

    // Parse each row
    const rows = [];
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

      rows.push(row);
    }

    return rows;
  }

  // Function to export selected columns as a CSV file
  function exportSelectedColumns() {
    // Filter out null selections
    const validColumns = selectedColumns.filter(col => col !== null);

    if (!$csvData || validColumns.length === 0) return;

    // Get the delimiter (default to comma)
    const delimiter = $csvData.delimiter || ',';

    // Create header row
    const selectedHeaders = validColumns.map(index => $csvData.headers[index]);

    // Create CSV content with headers and all rows
    let csvContent = selectedHeaders.join(delimiter) + '\n';

    // Add all rows (not just the paginated ones)
    for (const row of allRows) {
      const selectedData = validColumns.map(index => {
        // Handle possible delimiters in data with quotes
        const cell = row[index] || '';
        return cell.includes(delimiter) ? `"${cell}"` : cell;
      });
      csvContent += selectedData.join(delimiter) + '\n';
    }

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create a download link and trigger the download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Generate filename with requested format: {original-filename}-trimmed-export-{timestamp}.csv
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    
    // Use the stored original filename from csvData
    const originalFilename = $csvData.originalFilename || 'data';
    
    const suggestedFilename = `${originalFilename}-trimmed-export-${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', suggestedFilename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<div class="container">
  <h1 class="text-primary-dark mb-6 text-center">CSV WebHelper</h1>

  <div class="mb-6">
    <label for="csv-upload" class="upload-label">
      <div class="text-5xl mb-4">📊</div>
      <span>{$processing ? 'Processing...' : 'Choose a CSV file or drag it here'}</span>
    </label>
    <input id="csv-upload" type="file" accept=".csv" on:change={handleFileUpload} class="hidden" disabled={$processing} />
  </div>

  {#if $error}
    <div class="error">{$error}</div>
  {/if}

  {#if $csvData}
    <div class="results">
      <div class="stat-card">
        <h2 class="text-base font-medium">CSV Statistics</h2>
        <div class="grid grid-cols-3 gap-4 mt-2">
          <div>
            <div class="text-sm opacity-80">Rows</div>
            <div class="stat-value">{$csvData.rowCount.toLocaleString()}</div>
          </div>
          <div>
            <div class="text-sm opacity-80">Columns</div>
            <div class="stat-value">{$csvData.columnCount.toLocaleString()}</div>
          </div>
          <div>
            <div class="text-sm opacity-80">Size</div>
            <div class="stat-value">{$csvData.fileSizeMB} MB</div>
          </div>
        </div>
        {#if $csvData.analyzedRows < $csvData.rowCount}
          <div class="text-xs mt-4 opacity-80">
            Analysis limited to {$csvData.analyzedRows.toLocaleString()} rows
          </div>
        {/if}
      </div>

      <div class="mb-4 p-4 bg-white border border-border rounded">
        <label for="max-rows" class="block text-sm font-medium text-text-light mb-1">
          Max number of rows to analyze:
        </label>
        <input
          id="max-rows"
          type="number"
          min="10"
          max="1000000"
          bind:value={maxRows}
          on:input={onMaxRowsInput}
          class="py-2 px-3 w-full border border-border rounded shadow-sm focus:border-primary focus:outline-none"
        />
        <p class="text-xs text-text-light mt-1">
          Limits data type inference and cardinality analysis to improve performance with large files.
        </p>
      </div>

      <details>
        <summary class="font-bold py-2 cursor-pointer hover:text-primary">Column Preview</summary>
        <div class="overflow-x-auto mt-4">
          <table class="w-full border-collapse">
            <thead>
              <tr>
                <th class="p-2 text-left bg-bg-light border-b border-border">Field Name</th>
                <th class="p-2 text-left bg-bg-light border-b border-border">Data Type</th>
                <th class="p-2 text-left bg-bg-light border-b border-border">Cardinality</th>
                <th class="p-2 text-left bg-bg-light border-b border-border">Row 1</th>
                <th class="p-2 text-left bg-bg-light border-b border-border">Row 2</th>
                <th class="p-2 text-left bg-bg-light border-b border-border">Row 3</th>
              </tr>
            </thead>
            <tbody>
              {#each $csvData.headers as header, headerIndex}
                <tr class={headerIndex % 2 === 1 ? 'bg-bg-light' : ''}>
                  <th class="p-2 text-left border-b border-border">{header}</th>
                  <td class="p-2 text-left border-b border-border font-mono text-sm">
                    <span class="px-2 py-1 rounded bg-primary-light/10 text-primary-dark">
                      {$csvData.dataTypes[headerIndex]}
                    </span>
                  </td>
                  <td class="p-2 text-left border-b border-border font-mono">
                    <span class="px-2 py-1 rounded bg-success/10 text-primary-dark">
                      {$csvData.cardinalities[headerIndex].toLocaleString()}
                    </span>
                  </td>
                  {#each $csvData.sampleRows as row, rowIndex}
                    <td class="p-2 text-left border-b border-border">
                      {rowIndex < 3 && headerIndex < row.length ? row[headerIndex] : '-'}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </details>

      <details class="mt-4">
        <summary class="font-bold py-2 cursor-pointer hover:text-primary">Data Loader</summary>
        <div class="p-4 bg-white border border-border rounded mt-2">
          <h3 class="text-base font-medium mb-3">Interactive Data Table</h3>

          <div class="flex justify-between items-center mb-4">
            <div class="text-sm text-text-light">
              Use the dropdowns to select up to 5 columns to view and export
            </div>

            <button
              on:click={exportSelectedColumns}
              disabled={!selectedColumns.some(col => col !== null)}
              class="px-4 py-2 bg-primary text-white rounded flex items-center hover:bg-primary-dark disabled:opacity-50 disabled:bg-gray-400"
            >
              <span class="mr-2">Export Selected Columns</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>

          <div class="overflow-x-auto mb-4">
            <table class="w-full border-collapse">
              <thead>
                <tr>
                  {#each Array(5) as _, i}
                    <th class="p-2 bg-bg-light border-b border-border">
                      <select
                        class="w-full p-2 border border-border rounded bg-white text-text"
                        on:change={(e) => handleColumnChange(i, e.target.value)}
                      >
                        <option value="">Select column {i+1}</option>
                        {#each $csvData.headers as header, index}
                          <!-- Disable options that are already selected in other dropdowns -->
                          <option
                            value={index}
                            selected={selectedColumns[i] === index}
                            disabled={selectedColumns.includes(index) && selectedColumns[i] !== index}
                          >
                            {header}
                          </option>
                        {/each}
                      </select>
                    </th>
                  {/each}
                </tr>
              </thead>

              {#if selectedColumns.some(col => col !== null)}
                <tbody>
                  {#each paginatedRows as row, rowIndex}
                    <tr class={rowIndex % 2 === 1 ? 'bg-bg-light' : ''}>
                      {#each Array(5) as _, i}
                        <td class="p-2 text-left border-b border-border">
                          {selectedColumns[i] !== null && row[selectedColumns[i]] ? row[selectedColumns[i]] : '-'}
                        </td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              {:else}
                <tbody>
                  <tr>
                    <td colspan="5" class="p-4 text-center text-text-light italic">
                      Select at least one column to view data
                    </td>
                  </tr>
                </tbody>
              {/if}
            </table>
          </div>

          {#if selectedColumns.some(col => col !== null)}
            <div class="flex justify-between items-center">
              <div class="text-sm text-text-light">
                Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredRowsCount)}
                of {filteredRowsCount} rows
              </div>

              <!-- Pagination -->
              <div class="flex items-center gap-2">
                <button
                  on:click={() => currentPage = Math.max(1, currentPage - 1)}
                  disabled={currentPage === 1}
                  class="px-3 py-1 bg-bg-light border border-border rounded disabled:opacity-50"
                >
                  Previous
                </button>

                <span class="text-sm px-2">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
                  disabled={currentPage === totalPages}
                  class="px-3 py-1 bg-bg-light border border-border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          {/if}
        </div>
      </details>
    </div>
  {/if}
</div>
