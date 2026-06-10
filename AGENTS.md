<!-- BEGIN:nextjs-agent-rules -->

# AI Agent Guide: Truck Operations Management

This project uses a modern Next.js 16 stack. Follow these conventions to maintain consistency.

## Workflow

- **Branching**: Always create a new branch for every new feature or fix. Use a descriptive name like `feat/truck-schema` or `fix/button-loading`.

## Tech Stack Specifics

- **Next.js 16 (App Router)**: Use server components by default. Use `"use client"` only when necessary (interactivity).
- **React 19**: Be aware of new hooks like `useActionState` and changes in server action behavior.
- **Mantine 9 + Tailwind 4**: Combine Mantine components with Tailwind utility classes for layout and spacing. Use `postcss-preset-mantine` for styling consistency.
- **Drizzle ORM**: Use for all database interactions.
- **next-safe-action**: Mandatory for all Server Actions.

## Project Structure & Patterns

### 📂 `actions/` (Server Actions)

- All server actions should reside here.
- Use `next-safe-action` to define actions.
- Pattern:

  ```typescript
  "use server";
  import { authActionClient } from "@/lib/safe-action";
  import { z } from "zod";

  export const myAction = authActionClient
    .schema(z.object({ id: z.string() }))
    .action(async ({ parsedInput, metadata }) => {
      // implementation
    });
  ```

### 📂 `lib/` (Core Logic & Config)

- `lib/db/`: Drizzle client and schema definitions.
  - `schema.ts`: Define your tables here.
  - Use `createSelectSchema` and `createInsertSchema` from `drizzle-zod` for validation.
- `lib/utils.ts`: Shared utility functions.
- `lib/safe-action.ts`: Action client configuration.

### 📂 `components/` (UI)

- Organize by feature or shared status.
- **Mantine First**: Always prioritize using existing Mantine components (e.g., `Button`, `TextInput`, `Modal`) over creating custom ones. Check Mantine documentation before building anything from scratch.
- **Component Extraction**: If a UI pattern is reused and no suitable Mantine component exists, **extract it into a proper component** in `components/`. Do not leave large blocks of repetitive, complex JSX inline.
- **Data Tables**: Use `mantine-datatable` for all data-heavy listings.

## Coding Standards

- **Zero Trust**: Never trust client-side data. Always re-validate input in Server Actions, even if it was already validated on the frontend. Check permissions and ownership for every sensitive operation.
- **Type Safety**: Avoid `any`. Use Zod schemas for validation at boundaries.
- **Drizzle + Zod**: Use `drizzle-zod` to automatically generate base Zod schemas from your Drizzle tables. **Always refine or omit** fields for specific actions (e.g., `.omit({ id: true })`) to ensure security and prevent users from injecting system-managed fields.
- **Database**: Always use Drizzle migrations for schema changes.
- **Component Strategy**: Prefer Mantine for core UI. Only build custom components for domain-specific needs (e.g., `TruckStatusCard`). If a custom design is used more than twice, it MUST be extracted.
- **Styling**: Prefer Tailwind for quick adjustments, but use Mantine's theme for global consistency.
<!-- END:nextjs-agent-rules -->
