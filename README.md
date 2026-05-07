# Truck Operations Management

## Tech Stack

- **Next.js 16 (App Router)**: Framework for building the application.
- **React 19**: Frontend library.
- **Mantine 9**: UI component library.
- **mantine-datatable**: Specialized table components for data management.
- **Tailwind CSS 4**: Utility-first CSS framework for styling.
- **Drizzle ORM**: TypeScript ORM for database management.
- **Supabase (PostgreSQL)**: Database and backend services.
- **Better Auth**: Authentication solution.
- **next-safe-action**: Library for type-safe server actions.
- **Zod**: Schema validation for data integrity.

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run the development server:
   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Database

This project uses **Drizzle ORM** with **Drizzle Kit** for database management.

- **Generate Migrations**:
  ```bash
  pnpm drizzle-kit generate
  ```
- **Push Changes to DB**:
  ```bash
  pnpm drizzle-kit push
  ```
- **Database Studio**:
  ```bash
  pnpm drizzle-kit studio
  ```
