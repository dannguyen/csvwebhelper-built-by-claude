# CSV WebHelper

A web application that helps users upload, analyze and manipulate CSV files.

## Features

- Upload CSV files
- Automatic delimiter detection (comma, semicolon, tab)
- Display CSV statistics (row count, column count, file size)
- Preview the data, including inferring the type and cardinality of each column
- Interactive Data Loader with column selection and pagination
- Export selected columns to a new CSV file

## Technologies Used

- Svelte 4
- Tailwind CSS
- Vite

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

### Building for Production

Build the project:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

- `src/` - Source files
  - `lib/` - Reusable components
  - `App.svelte` - Main application component
  - `main.js` - Application entry point
- `public/` - Static assets
- `index.html` - HTML entry point
