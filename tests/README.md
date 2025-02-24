# CSV WebHelper Test Suite

This directory contains tests for the CSV WebHelper application. The tests are written using [Vitest](https://vitest.dev/), a Vite-native test framework.

## Test Files

1. **csvUtils.test.js** - Tests for the utility functions:
   - `inferDataType`: Tests how the function determines the data type of values
   - `calculateCardinality`: Tests counting unique values in arrays

2. **csvStore.test.js** - Tests for the Svelte store and CSV parsing logic:
   - CSV parsing logic
   - Delimiter detection
   - Data type inference
   - Cardinality calculation
   - Max rows handling

3. **CSVWebHelper.test.js** - Tests for the Svelte component:
   - UI rendering
   - Component interactions
   - Store integration

## Running Tests

Run tests in watch mode:
```bash
npm test
```

Run tests once:
```bash
npm run test:run
```

Run tests with coverage:
```bash
npm run coverage
```

## Coverage Report

After running the coverage command, a detailed report will be available in the `coverage` directory.

## Test Structure

Each test file follows the standard Vitest pattern:

```javascript
describe('Component or Function', () => {
  // Setup code with beforeEach if needed
  
  it('should do something specific', () => {
    // Test logic
    expect(actual).toBe(expected);
  });
});
```