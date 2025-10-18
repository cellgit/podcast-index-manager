## Podcast Index Manager

Next.js 15 admin console for orchestrating Podcast Index ingests with PostgreSQL persistence and Prisma. The UI uses shadcn-inspired components implemented via CSS modules (no Tailwind dependency).

### Prerequisites
- Node.js 20+
- PostgreSQL instance reachable at the connection string outlined in `.env.example`
- Redis 7+ accessible via `REDIS_URL`

### Getting Started
1. Copy `.env.example` to `.env.local` (for Next.js) and `.env` (for Prisma CLI) and adjust values as needed.
2. Install dependencies: `npm install`
3. Apply database migrations (creates schema): `npm run prisma:migrate`
4. Start the development server: `npm run dev`
5. (Optional) Start the BullMQ worker in a second terminal: `npm run dev:worker`

The app runs on `http://localhost:3000`. Dashboard data comes from the Prisma-managed database; ensure both PostgreSQL and Redis are reachable before starting the server.

### Docker (web + worker)
The default `docker-compose.yml` now provisions four services: `postgres`, `redis`, `web`, and `worker`.

```bash
docker compose up --build
```

- The web UI listens on `http://localhost:3000` and includes the queue dashboard at `/dashboard/queue`.
- The worker container runs `npm run start:worker` and keeps the BullMQ queue online.
- Update `.env` as needed; Compose overrides `DATABASE_URL` and `REDIS_URL` with in-cluster addresses.

### Available Scripts
- `npm run dev` – start Next.js in development mode
- `npm run build` – produce a production build
- `npm start` / `npm run start:web` – run the production server
- `npm run start:worker` – launch the BullMQ worker in production mode
- `npm run dev:worker` – run the worker with live reload (tsx watch)
- `npm run lint` – execute ESLint checks
- `npm run test` / `npm run test:watch` – run Vitest unit tests
- `npm run prisma:generate` – regenerate the Prisma client
- `npm run prisma:migrate` – run a Prisma migration in development

### Testing
Vitest is configured with JSDOM. Global `fetch` calls are stubbed in `tests/setup-env.ts`. Invoke `npm run test` for a one-off run or `npm run test:watch` during development.

### Monitoring & alerts
- Queue monitoring and retry tools are available at `/dashboard/queue` (Bull Board via Hono adapter).
- Structured logs use Pino. Adjust verbosity with `LOG_LEVEL` (default `debug` in development, `info` in production).
- Slack notifications require `SLACK_WEBHOOK_URL`. Optional email alerts can be configured via the `ALERT_EMAIL_*` variables; emails are skipped automatically when configuration is incomplete.

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
