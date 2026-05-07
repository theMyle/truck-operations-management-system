<!-- BEGIN:nextjs-agent-rules -->
# AI Agent Guide: Truck Operations Management

This project uses a modern Next.js 16 stack. Follow these conventions to maintain consistency.

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
  "use server"
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
- Use Mantine components where possible for complex UI elements (Inputs, Modals, Tables).
- Use `mantine-datatable` for all data-heavy listings.

## Coding Standards
- **Type Safety**: Avoid `any`. Use Zod schemas for validation at boundaries.
- **Drizzle + Zod**: Use `drizzle-zod` to automatically generate Zod schemas from your Drizzle tables for consistent validation.
- **Database**: Always use Drizzle migrations for schema changes.
- **Styling**: Prefer Tailwind for quick adjustments, but use Mantine's theme for global consistency.
<!-- END:nextjs-agent-rules -->
