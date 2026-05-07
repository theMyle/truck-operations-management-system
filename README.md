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

## Development Guidelines

### Workflow & Architecture
- **Branching**: Use separate branches for every feature/fix (e.g., `feat/trucks`).
- **Folder Structure**:
  - `actions/`: All Server Actions using `next-safe-action`.
  - `lib/db/`: Database schema and client.
  - `components/`: UI components (prioritize Mantine, extract reused patterns).

### Core Principles
- **Mantine First**: Use existing Mantine components whenever possible.
- **Zero Trust**: Always re-validate input and permissions in Server Actions.
- **Drizzle + Zod**: Generate base schemas from tables, then refine or omit fields for security.

## Database

This project uses **Drizzle ORM** with **Drizzle Kit** for database management.

- **Generate Migrations**: Scan `schema.ts` and create SQL migration files in the `drizzle/` folder.
  ```bash
  pnpm drizzle-kit generate
  ```
- **Push Changes**: Directly sync `schema.ts` with the database (useful for rapid prototyping).
  ```bash
  pnpm drizzle-kit push
  ```
- **Database Studio**: Open a local web-based dashboard to browse and edit your database data.
  ```bash
  pnpm drizzle-kit studio
  ```
