# ClassFlow

Center Management System

ClassFlow is a full-stack application for managing the daily operations and finances of an educational center. It handles students, teachers, groups, schedules, enrollments, attendance, payments, teacher salaries, and expenses — with multi-tenant support, role-based access control, and bilingual UI (English/Arabic).

## Tech stack

| Layer    | Technology                                                  |
| -------- | ----------------------------------------------------------- |
| Backend  | Node.js 22+, Express 5, TypeScript, Prisma 7 (PostgreSQL)  |
| Frontend | Next.js 16, React 19, TanStack Query, Tailwind CSS 4       |
| Auth     | JWT (access + refresh), bcrypt, RBAC permissions            |
| Forms    | react-hook-form + Zod validation                            |
| UI       | Lucide icons, class-variance-authority, tailwind-merge      |

## Features

- **Students** — profiles, enrollment history, billing cycles, payment tracking
- **Teachers** — profiles, group assignments, salary calculation and payment
- **Groups** — CRUD with subjects, fees, schedules, and student enrollment
- **Schedules** — weekly schedule view with day/group filters
- **Attendance** — session-based attendance tracking with present/absent marking
- **Payments** — record payments with method, date, amount; filter by group/date/method; clickable student links
- **Expenses** — CRUD with category filtering (Rent, Utilities, Supplies, Marketing, Maintenance, Salaries, Other) and date range
- **Salaries** — calculate teacher salaries from student payments (adjustable percentage), bulk pay, auto-calculation on 1st of each month, detailed report per teacher with per-student payment breakdown
- **Dashboard** — net collected amount (payments − expenses), recent payments, late students, overdue payments
- **Overdue payments** — dedicated page listing students with outstanding balances
- **Multi-tenant** — center-scoped data isolation
- **RBAC** — role-based permissions (Super Admin, Admin, Teacher, Accountant, Receptionist)

## Getting started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL + JWT secrets
npx prisma migrate deploy
npm run dev
```

Server runs at `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3001`.

## Scripts

### Backend

| Command                 | Description                        |
| ----------------------- | ---------------------------------- |
| `npm run dev`           | Start dev server with hot reload   |
| `npm run build`         | Generate Prisma client + build     |
| `npm run start`         | Run the built server               |
| `npm run typecheck`     | TypeScript type check              |
| `npm run lint`          | Biome lint + format check          |
| `npm run lint:fix`      | Biome lint + autofix               |
| `npm run prisma:studio` | Open Prisma Studio                 |
| `npm run prisma:migrate`| Run Prisma migrations (dev)        |
| `npm run seed:demo`     | Seed demo data                     |
| `npm run seed:students` | Seed demo students                 |
| `npm run create:superadmin` | Create a super admin user      |

### Frontend

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start dev server on port 3001      |
| `npm run build`      | Production build                   |
| `npm run start`      | Run production server              |
| `npm run typecheck`  | TypeScript type check              |
| `npm run lint`       | ESLint                             |
| `npm run test`       | Run tests (Vitest)                 |
| `npm run test:watch` | Run tests in watch mode            |

## Architecture

```
ClassFlow/
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/          # Authentication, JWT, login/register
│       │   ├── users/         # User management, RBAC
│       │   ├── students/      # Student profiles, billing cycles
│       │   ├── teachers/      # Teacher profiles
│       │   ├── groups/        # Groups, subjects, fees
│       │   ├── schedules/     # Weekly schedule slots
│       │   ├── attendance/    # Session-based attendance
│       │   ├── enrollments/   # Student-group enrollments
│       │   ├── finance/       # Payments, expenses, salaries
│       │   └── dashboard/     # Dashboard stats, overdue
│       └── shared/            # Middleware, Prisma client, scheduler
└── frontend/
    └── app/(dashboard)/       # Next.js pages
    └── features/              # Feature modules (types, API, hooks, components)
    └── components/            # Shared UI components
```
