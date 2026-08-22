# ClassFlow Frontend Plan

## 1. Frontend Goals

Build a responsive center-management dashboard for staff to:

- Track center expenses
- Add and manage students
- Enroll students into groups
- Record and review attendance
- Manage teachers and teacher salaries
- Manage groups and schedules
- Record payments from enrolled students
- Respect the backend role and center permissions

## 2. Recommended Stack

- Next.js with the App Router
- TypeScript
- TanStack Query for backend state, caching, mutations, and invalidation
- React Hook Form with Zod for forms and validation
- Tailwind CSS with an accessible component system
- The existing Express backend as the API
- HttpOnly refresh-token cookies with in-memory access-token handling
- Lucide icons for actions and navigation

Create the frontend as a separate Next.js project under `frontend/`. The backend remains under `backend/`.

## 3. Suggested Frontend Structure

```text
frontend/
  app/
    (auth)/
      login/page.tsx
      signup/page.tsx
    (dashboard)/
      layout.tsx
      dashboard/page.tsx
      students/page.tsx
      students/[studentId]/page.tsx
      enrollments/page.tsx
      teachers/page.tsx
      teachers/[teacherId]/page.tsx
      groups/page.tsx
      groups/[groupId]/page.tsx
      schedules/page.tsx
      sessions/page.tsx
      sessions/[sessionId]/attendance/page.tsx
      payments/page.tsx
      salaries/page.tsx
      expenses/page.tsx
      users/page.tsx
      unauthorized/page.tsx
    layout.tsx
    loading.tsx
    error.tsx
    globals.css
  components/
    providers.tsx
    layout/
    navigation/
    feedback/
    forms/
    tables/
  features/
    auth/
    dashboard/
    students/
    enrollments/
    teachers/
    groups/
    schedules/
    attendance/
    payments/
    salaries/
    expenses/
    users/
  lib/
    api-client.ts
    api-errors.ts
    auth-store.ts
    date-format.ts
    currency-format.ts
    permissions.ts
  types/
    api.ts
    auth.ts
  middleware.ts
  next.config.ts
  package.json
```

Keep each feature responsible for its API functions, query keys, types, forms, table columns, and page components. Shared components should contain reusable UI behavior, not domain-specific business rules.

## 4. Application Shell

Use Next.js route groups, layouts, middleware, and server/client component boundaries for authenticated and public routes.

### Public Routes

- `/login`
- `/signup` if public signup remains enabled
- `/unauthorized`

### Authenticated Routes

- `/dashboard`
- `/students`
- `/students/:studentId`
- `/enrollments`
- `/teachers`
- `/teachers/:teacherId`
- `/groups`
- `/groups/:groupId`
- `/schedules`
- `/sessions`
- `/sessions/:sessionId/attendance`
- `/payments`
- `/salaries`
- `/expenses`
- `/users`
- `/settings` if needed later

The application shell should include:

- A compact sidebar or responsive navigation drawer
- Current user and role display
- Current center context
- Breadcrumbs on detail pages
- A global toast area
- Loading and error boundaries
- A logout action

On mobile, navigation should collapse into a drawer while tables should remain usable through responsive columns, horizontal scrolling, or stacked row layouts.

## 5. Authentication and Session Handling

Implement authentication before domain pages.

### Login Flow

1. Submit username, password, and optional center ID.
2. Store the access token in memory or a carefully protected client store.
3. Let the existing Express backend manage the refresh token through its HttpOnly cookie.
4. Fetch `/api/auth/me` after login or page reload.
5. Refresh the access token when the API returns an expired-token response.
6. Clear cached queries and redirect to `/login` on logout.

### API Client

The API client should:

- Call the existing Express backend through a configurable backend URL.
- Add the bearer access token to protected requests.
- Send credentials so the HttpOnly refresh-token cookie works.
- Normalize backend errors into a consistent frontend error shape.
- Avoid logging passwords, access tokens, refresh cookies, or sensitive request data.

Next.js middleware should protect navigation using the authenticated state available to the frontend. It should not attempt to read the HttpOnly refresh token. Access-token refresh should happen through the API client by calling the Express auth refresh endpoint with credentials, then retrying the original request.

## 6. Permission-Aware UI

The frontend should hide unavailable navigation items and disable unavailable actions, but the backend remains the final authority.

Use the backend permission matrix as the source of truth:

- SUPERADMIN: global access
- ADMIN: center administration and user management
- MANAGER: operational center management, groups, attendance, salaries, and expense creation
- ACCOUNTANT: payments, salaries, and expense management
- RECEPTIONIST: student intake, group viewing, attendance, and student payment logging

Create a small permission helper:

```ts
can(resource, action)
```

Use it for:

- Sidebar item visibility
- Page-level access guards
- Create, edit, delete, and mark-paid buttons
- Empty states that explain unavailable access without exposing protected data

Do not rely on frontend checks for security.

## 7. Dashboard

The dashboard should provide a useful operational summary:

- Active student count
- Active teacher count
- Groups currently running
- Today\'s sessions
- Attendance completion status
- Payments recorded for the current period
- Unpaid teacher salaries
- Recent expenses

Start with API-backed summary cards and recent-activity tables. Add charts only after the core workflows are stable and the backend provides reliable aggregation endpoints.

## 8. Students and Enrollments

### Student List

Use a dense, filterable table with:

- Full name
- Phone and parent phone
- Grade and school
- Status
- Join date
- Current enrollment count
- Row actions

Filters:

- Search
- Status
- Pagination

Actions:

- Add student
- Edit student
- Change status
- View details
- Delete when permitted

### Student Form

Fields should match the backend contract:

- Full name
- Phone
- Parent phone
- Grade
- School
- Address
- Join date
- Status
- Notes

### Enrollment Workflow

From a student detail page:

1. Show current active and inactive enrollments.
2. Select a group with teacher, subject, room, fee, and available capacity.
3. Confirm enrollment date.
4. Submit the enrollment.
5. Refresh the student and group data.
6. Show capacity or duplicate-enrollment errors inline.

Also provide a group detail view that lists enrolled students and allows status changes where permitted.

## 9. Teachers and Salaries

### Teacher List

Display:

- Name
- Phone
- Specialization
- Current salary
- Active state
- Group count

Actions:

- Add teacher
- Edit teacher
- Activate/deactivate teacher
- View teacher details
- View salary history

### Salary Page

Provide:

- Salary records table
- Teacher filter
- Month and year filters
- Paid/unpaid filter
- Total amount for the selected period
- Unpaid salary count

Salary form fields:

- Teacher
- Salary month
- Salary year
- Amount
- Payment date
- Paid state
- Notes

The mark-paid interaction should be explicit and show the payment date. Use confirmation for deleting salary records.

## 10. Groups and Schedules

### Groups Page

Display:

- Group name
- Subject
- Teacher
- Room
- Fee
- Payment type
- Maximum students
- Current enrollment count

Actions:

- Add group
- Edit group
- Delete group
- View group details

The group form should validate:

- Positive fee
- Valid payment type
- Maximum students greater than zero
- Teacher selection

### Schedule Page

Provide both:

- A weekly calendar or weekday grid for scanning
- A table view for precise editing

Schedule fields:

- Group
- Day of week
- Start time
- End time

Show conflicts and invalid time ranges clearly. When a schedule has recorded sessions, explain why it cannot be deleted instead of showing a generic error.

## 11. Sessions and Attendance

### Sessions Page

Display:

- Session date
- Group
- Schedule time
- Completion state
- Attendance state

Filters:

- Date range
- Group
- Schedule
- Completed/uncompleted

Actions:

- Create session
- Open attendance
- Mark session complete

### Attendance Page

The attendance page should be optimized for rapid daily use:

- Show session and group context at the top.
- List active enrolled students.
- Use a clear PRESENT/ABSENT segmented control or radio group.
- Support notes per student.
- Show unsaved changes.
- Provide a single save action for the full attendance list.
- Show success feedback and the last saved time.

Before submission:

- Prevent duplicate enrollment rows.
- Warn when records are missing if the workflow requires a complete list.
- Handle inactive or removed enrollments returned by the backend.

The backend transaction remains authoritative for the final result.

## 12. Student Payments

### Payments Page

Display:

- Student name
- Group
- Amount
- Payment date
- Payment method
- Notes

Filters:

- Enrollment or student
- Payment method
- Date range
- Pagination

### Record Payment Flow

The preferred flow is from a student or enrollment detail page:

1. Select an active enrollment.
2. Show the group fee and payment type for context.
3. Enter amount, date, method, and notes.
4. Submit the payment.
5. Refresh enrollment payment history and dashboard totals.

Receptionists can create and update payment records according to the permission matrix. Delete controls should only appear for users with full payment-management permission.

## 13. Center Expenses

### Expenses Page

Display:

- Expense date
- Category
- Amount
- Description
- Center
- Created date

Filters:

- Category
- Date range
- Pagination

Actions:

- Record expense
- Edit expense when permitted
- Delete expense when permitted
- View expense details

Expense form fields:

- Category
- Amount
- Expense date
- Description

The page should show a period total and category breakdown when aggregation data is available. Until then, calculate only from the currently loaded records and label it clearly.

Managers should see the create action when allowed. Update and delete actions should be restricted to users with `manageExpenses` permission.

## 14. Reusable UI Patterns

Build these shared components early:

- `PageHeader` with title and primary action
- `DataTable` with loading, empty, error, pagination, and responsive states
- `FilterBar`
- `ConfirmDialog`
- `FormDialog`
- `MoneyInput`
- `DateInput`
- `StatusBadge`
- `PermissionGate`
- `ErrorState`
- `EmptyState`
- `SkeletonTable`
- `ToastProvider`

Use icons in action buttons and provide tooltips for unfamiliar icon-only controls. Keep text actions for commands where an icon alone would be ambiguous.

## 15. Server State and Cache Rules

Define query keys by feature:

```text
students
student detail
enrollments
teachers
groups
schedules
sessions
session attendance
payments
salaries
expenses
```

After mutations:

- Invalidate the changed resource list.
- Invalidate related detail queries.
- Update dependent counts when practical.
- Never rely on stale optimistic data for financial records.

Use optimistic updates only for low-risk UI state. Financial records, enrollment capacity, and attendance should prefer confirmed server responses.

## 16. Forms and Validation

Mirror backend Zod constraints in frontend schemas for early feedback, including:

- Required fields
- String lengths
- Positive amounts
- Decimal precision
- Valid enum values
- Valid dates
- Valid time ranges
- Month and year ranges

Server errors must still be displayed because frontend validation can become outdated.

Forms should support:

- Disabled submit state while saving
- Inline field errors
- API error summary
- Unsaved-change protection for attendance and long forms
- Clear success feedback

## 17. Data Formatting

Create centralized formatting utilities:

- Currency formatting from decimal strings
- Localized dates
- Time formatting
- Enum labels such as `PER_SESSION` to `Per session`
- Phone number display

Do not convert financial values through imprecise floating-point arithmetic for totals. Prefer decimal-safe handling or backend-provided totals.

## 18. Responsive and Accessibility Requirements

The frontend should work on desktop, tablet, and mobile.

Requirements:

- Keyboard-accessible navigation and dialogs
- Visible focus states
- Labels for all form controls
- Proper table headers
- Accessible status indicators beyond color alone
- Sufficient contrast
- Touch-friendly action targets
- No text overflow inside buttons, cards, or table cells
- Responsive layouts without overlapping content

Operational pages should prioritize scanning and repeated actions over decorative content.

## 19. Testing Strategy

### Unit Tests

Test:

- Permission helpers
- Form schemas
- Currency/date formatting
- Table filter transformations
- Attendance draft-state logic

### Component Tests

Test:

- Login form
- Student form
- Enrollment dialog
- Payment form
- Salary form
- Expense form
- Attendance editor
- Permission-based action visibility
- Loading, empty, and error states

### End-to-End Tests

Use a browser automation tool to cover the critical workflows:

1. Login.
2. Add a student.
3. Add or select a group.
4. Enroll the student.
5. Create a session.
6. Record attendance.
7. Record a student payment.
8. Record a teacher salary.
9. Record a center expense.
10. Verify role restrictions.

Test at desktop and mobile viewport sizes.

## 20. Delivery Phases

### Phase 1: Foundation

- Scaffold the Next.js TypeScript app with the App Router in `frontend/`.
- Add the TanStack Query provider, API client, auth provider, Tailwind CSS, and global styles.
- Build login, logout, token refresh, and protected routes.
- Build the application shell and permission-aware navigation.

### Phase 2: Core Academic Data

- Implement students list and form.
- Implement teachers list and form.
- Implement groups list and form.
- Implement enrollment workflow.

### Phase 3: Scheduling and Attendance

- Implement schedules page.
- Implement sessions page.
- Implement attendance recording page.
- Add date, weekday, completion, and attendance states.

### Phase 4: Finance

- Implement student payments.
- Implement teacher salaries and mark-paid flow.
- Implement center expenses.
- Add period filters and financial summaries.

### Phase 5: Dashboard and Polish

- Add operational dashboard summaries.
- Improve responsive layouts.
- Add empty, loading, and error states everywhere.
- Add accessibility review.
- Add end-to-end tests for critical workflows.
- Build and preview the production frontend.

## 21. Backend Coordination

The frontend should use the existing endpoint contracts rather than embedding business rules. Before implementing each feature, document its API functions and response shapes.

Potential backend enhancements for a richer dashboard can be added later:

- Dashboard summary endpoint
- Student payment totals by period
- Expense totals by category and period
- Salary totals by month
- Group enrollment counts included in group responses
- Attendance completion summaries

Do not block the first frontend release on these aggregation endpoints. Build the core CRUD and workflow screens first.

## 22. Definition Of Done

A frontend feature is complete when:

- It is reachable through authenticated routing.
- It displays loading, empty, success, and error states.
- It respects the permission matrix in the UI.
- It validates input before submission.
- It handles backend validation and authorization errors.
- It refreshes related data after mutations.
- It works on desktop and mobile.
- It has keyboard and screen-reader-friendly controls.
- It has focused component tests.
- Its critical workflow has an end-to-end test.