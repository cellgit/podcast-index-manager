## Podcast Index Manager

Next.js 15 admin console for orchestrating Podcast Index ingests with PostgreSQL persistence and Prisma. The UI uses shadcn-inspired components implemented via CSS modules (no Tailwind dependency).

### Prerequisites
- Node.js 20+
- PostgreSQL instance reachable at the connection string outlined in `.env.example`

### Getting Started
1. Copy `.env.example` to `.env.local` (for Next.js) and `.env` (for Prisma CLI) and adjust values as needed.
2. Install dependencies: `npm install`
3. Apply database migrations (creates schema): `npm run prisma:migrate`
4. Start the development server: `npm run dev`

The app runs on `http://localhost:3000`. Dashboard data comes from the Prisma-managed database; ensure the database is reachable before starting the server.

### Available Scripts
- `npm run dev` – start Next.js in development mode
- `npm run build` – produce a production build
- `npm start` – run the production server
- `npm run lint` – execute ESLint checks
- `npm run test` / `npm run test:watch` – run Vitest unit tests
- `npm run prisma:generate` – regenerate the Prisma client
- `npm run prisma:migrate` – run a Prisma migration in development

### Testing
Vitest is configured with JSDOM. Global `fetch` calls are stubbed in `tests/setup-env.ts`. Invoke `npm run test` for a one-off run or `npm run test:watch` during development.

### Project Layout
- `src/app` – Next.js route handlers and pages
- `src/components` – shared UI and feature components
- `src/lib` – infrastructure helpers (Prisma, Podcast Index client, etc.)
- `src/services` – domain logic for podcast ingestion and syncing
- `prisma` – schema and migrations
- `tests` – Vitest setup and future test suites

### Notes
- The UI avoids TailwindCSS; styling lives in CSS modules under `src`.
- Prisma client types require `npm run prisma:generate` after schema updates.

