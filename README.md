# ClassFlow

Center Management System

ClassFlow is organized as a backend/frontend monorepo. The backend is a REST API for managing the daily operations and finances of an educational center. The system manages students, teachers, groups, schedules, enrollments, attendance, payments, teacher salaries, and expenses.

Built with Node.js, Express, TypeScript, PostgreSQL, and Prisma, with a modular architecture designed to be secure, maintainable, and easy to extend.

## Getting started

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL + JWT secrets
npx prisma migrate deploy
npm run dev
```

Server runs at `http://localhost:3000`.

## Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `cd backend`         | Enter the backend project             |
| `npm run dev`        | Start dev server with hot reload     |
| `npm run build`      | Generate Prisma client + build       |
| `npm run start`      | Run the built server                 |
| `npm run typecheck`  | TypeScript type check                |
| `npm run lint`       | Biome lint + format check            |
| `npm run lint:fix`   | Biome lint + autofix                 |
| `npm run prisma:studio` | Open Prisma Studio               |
