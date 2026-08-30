# CIAS React + Node.js Rewrite — Project Scope

## Purpose

Rewrite the legacy CodeIgniter admin-panel/user-management boilerplate as a reusable, modern TypeScript foundation for larger products such as e-commerce, matrimonial, ERP, and CRM applications.

The legacy application remains a functional reference only. Its PHP code and `schema.sql` are not part of the new runtime.

## Agreed architecture

| Area | Decision |
| --- | --- |
| Repository | pnpm workspace monorepo |
| Web application | React, TypeScript, Vite, AdminLTE styling |
| API | Node.js, TypeScript, NestJS |
| Database | MySQL and TypeORM migrations |
| Server/API state | TanStack Query |
| HTTP client | Axios instance with cookie support and normalized errors |
| Global client state | Redux Toolkit |
| Forms | React Hook Form and Zod |
| Authentication | JWT stored in secure HTTP-only cookies |
| Authorization | Roles and normalized permissions, enforced by the API |

## Repository layout

```text
apps/
  api/                  NestJS API and TypeORM source
  web/                  React/Vite admin application
packages/
  shared-types/         Shared frontend types and permission definitions
docs/
  project-scope.md      This document
schema.sql              Legacy CodeIgniter schema reference
```

The web application is organized by responsibility rather than by a single flat `src` folder:

```text
apps/web/src/
  app/                  Application root, providers, Redux store
  components/layout/    Reusable app shell: navbar, sidebar, header, footer
  features/             Feature-owned pages and API modules
    auth/
    dashboard/
    users/
    roles/
    login-history/
  lib/                  Shared API client and Query Client
```

## Database approach

The new project does not import `schema.sql` as its source of truth. It uses versioned TypeORM migrations.

The first migration creates:

- `roles`
- `permissions`
- `role_permissions`
- `users`
- `user_roles`
- `password_reset_tokens`
- `login_events`
- TypeORM's `migrations` history table

The schema uses UUID identifiers, foreign keys, indexes, soft deletion for principal records, and `utf8mb4`-compatible MySQL tables.

## Environment configuration

The API and its migrations read only:

```text
apps/api/.env
```

The root `.env` file is not used by the current application. `.env.example` files are templates and are never read at runtime.

Important API values include:

```env
DATABASE_ENABLED=true
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cias_react_dev
DB_USER=cias_dev
DB_PASSWORD=...
JWT_ACCESS_SECRET=...
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=...
```

Secrets, passwords, and real `.env` files must not be committed to Git.

## Local commands

```powershell
# Install dependencies
pnpm install

# Start the React app and API
pnpm dev

# Start only one application
pnpm dev:web
pnpm dev:api

# Build both applications
pnpm build

# Apply database migrations
pnpm migration:run

# Create the first administrator, role, and permissions
pnpm seed
```

The Vite web port is configured in `apps/web/vite.config.ts`. The API normally uses port `3000`.

## DONE

- [x] Reviewed the legacy CodeIgniter repository and database schema.
- [x] Chosen the React + Node.js technology stack and monorepo approach.
- [x] Created the pnpm workspace with `apps/web`, `apps/api`, and `packages/shared-types`.
- [x] Added React/Vite, AdminLTE styling, Redux Toolkit, TanStack Query, React Hook Form, and Zod.
- [x] Rebuilt the application shell around the AdminLTE v4 layout: header navbar, branded sidebar, content header, dashboard small boxes, cards, and footer.
- [x] Refactored the web app into feature-focused modules with reusable layout components, shared providers/state, centralized API requests, and separated global styling.
- [x] Added Axios as the shared HTTP client with secure-cookie support, a request timeout, and normalized API errors.
- [x] Added application-wide Bootstrap-native toast notifications for authenticated action successes, failures, sign-out, and expired sessions.
- [x] Standardized password validation to a minimum of 8 characters including a letter, number, and special character across the API, seed command, and web forms.
- [x] Replaced project-specific screen styling with AdminLTE and Bootstrap's native layout, card, table, modal, form, badge, alert, and utility classes.
- [x] Added the NestJS API, MySQL/TypeORM configuration, and health endpoint.
- [x] Added the TypeORM migration framework and applied the initial migration to the development database.
- [x] Added normalized roles, permissions, user roles, password-reset tokens, and login-event data models.
- [x] Added the System Administrator seed command.
- [x] Added JWT-cookie authentication structure: login, logout, and current-user endpoints.
- [x] Added password hashing with bcrypt and login-event recording.
- [x] Added reusable access-token and permission guard foundations for protected API routes.
- [x] Added a React login page and authenticated dashboard shell.
- [x] Added protected user-management APIs for listing, creating, updating, and deactivating users.
- [x] Added protected role lookup for user-role assignment.
- [x] Added the React user-management screen with search, pagination, create, edit, role selection, and deactivation actions.
- [x] Added protected role-management APIs for listing, creating, editing, and deactivating roles.
- [x] Added permission lookup and role-permission assignment APIs.
- [x] Added the React role and permission management screen with permission selection.
- [x] Added protected login-history API with pagination, search, date, and success/failure filters.
- [x] Added the React login-history screen.
- [x] Added change-password, forgot-password, and reset-password API flows.
- [x] Added standalone public routes for `/forgot-password` and `/reset-password`.
- [x] Added an AdminLTE-style authenticated user menu with profile and sign-out actions, plus a protected profile screen.
- [x] Added authenticated self-profile updates for name, email, and mobile.
- [x] Added one-hour hashed reset tokens and development-only reset-link output.
- [x] Added React forgot-password and reset-password screens, with authenticated password changes available from the Profile page.
- [x] Fixed environment loading so API runtime and TypeORM migrations use `apps/api/.env`.
- [x] Fixed local dependency compatibility issues affecting TypeORM and Express request parsing.
- [x] Verified the project builds successfully and login validation returns a normal `400` response instead of a `500` error.

## TODO

### Authentication completion

- [ ] Run `pnpm seed` with a unique administrator password.
- [ ] Test login, logout, cookie persistence, and `/api/auth/me` end-to-end.
- [ ] Add refresh-token rotation and token revocation for longer-lived sessions.
- [ ] Add rate limiting and account-locking rules for repeated failed logins.

### User and role management

- [ ] Add a user restore action and a permanent deletion policy, if required.
- [ ] Add a role restore action, if required.
- [ ] Enforce permissions on every protected API route and hide unavailable UI controls.

### Application foundation

- [ ] Move shared API DTOs and permission constants into a compiled shared package where practical.
- [ ] Add reusable UI primitives for data tables, dialogs, form fields, status badges, and empty/loading states as more features are built.
- [ ] Add standard API error responses, request logging, and structured audit events.
- [ ] Add automated API unit/integration tests and React component tests.
- [ ] Add linting, formatting, pre-commit checks, and CI workflow.
- [ ] Add email delivery configuration and a local mail-testing tool for password-reset tests; replace development-only reset-link output.

### Deployment and security

- [ ] Create production environment documentation.
- [ ] Add Docker/local service configuration if desired.
- [ ] Configure reverse proxy, HTTPS, cookie security, CORS, and CSRF protection for deployment.
- [ ] Add database backup, monitoring, error tracking, and deployment migration procedure.

## Immediate next step

Run the seeded application through the browser and test the core user flows:

```powershell
pnpm dev
```

Then validate login, user administration, role permissions, password reset, and login-history filtering. The next implementation pass should extract common table, dialog, status-badge, and form controls as the UI expands.
