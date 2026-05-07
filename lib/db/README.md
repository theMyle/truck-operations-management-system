# Database Architecture

This directory contains the Drizzle ORM configuration and schema definitions for the Truck Operations Management System.

Database logic is split between the **Drizzle client** (`index.ts`) and the **Entity definitions** (`schema/` folder). All tables are centrally exported via `schema/index.ts`.

## Adding Tables
1. Create a new file in `schema/` (e.g., `trucks.ts`).
2. Export it from `schema/index.ts`.
3. Run `pnpm drizzle-kit generate` then `pnpm drizzle-kit push`.

## Connection Strategy
We use a **Singleton Pattern** in `index.ts` to prevent multiple connections during development (HMR).

### ⚠️ Circular Imports
- **Schema files** must only import from `drizzle-orm` or other sibling schema files.
- **NEVER** import the `db` client inside a schema file.
- **NEVER** import from the `schema/index.ts` barrel inside a schema file; use direct relative imports instead (e.g., `./trucks`).

## Usage in Code

```typescript
import { db } from "@/lib/db";
import { trucks } from "@/lib/db/schema";

const allTrucks = await db.select().from(trucks);
```
