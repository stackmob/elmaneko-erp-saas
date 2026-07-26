# ELMANEKO-3D Management System

ELMANEKO-3D is a comprehensive ERP (Enterprise Resource Planning) and management system tailored specifically for a 3D printing business. Built with React and Vite, it allows you to manage everything from filament inventory and 3D printers to client budgets, sales, and production orders.

## Features

- **Dashboard**: Overview of key metrics and business performance.
- **Inventory Management**: Track filaments (materials, colors, weights) and purchases.
- **Printer Management**: Manage 3D printers, their maintenance status, and operational costs.
- **Energy Tariffs**: Calculate and track energy consumption costs for accurate pricing.
- **Product Catalog**: Maintain a catalog of 3D printable products and their specifications.
- **Production Orders**: Track the status of active production jobs.
- **Budgets & Quotes**: Generate and manage client quotes.
- **Sales & CRM**: Track sales, manage client information, and view purchase history.
- **Data Backup**: Export and import your data (runs locally via `localStorage`).

## Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Motion (Framer Motion)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository or download the source code.
2. Install the dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

### Building for Production

To create a production build:
```bash
npm run build
```
The optimized output will be in the `dist` directory. You can preview it locally using `npm run preview`.

## Data Storage
Currently, this application uses the browser's `localStorage` for data persistence. Ensure you use the built-in **Backup** module to regularly export your data to avoid data loss if you clear your browser cache.