# CIAS Admin Panel

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-TypeORM-4479A1?logo=mysql&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm&logoColor=white)

A secure, reusable admin-panel foundation for larger TypeScript applications such as e-commerce, CRM, ERP, and matrimonial platforms. It replaces the legacy CodeIgniter user-management panel with a React, NestJS, and MySQL monorepo.

## Highlights

- AdminLTE 4 interface built with React, TypeScript, and Vite.
- User management with regular, system-administrator, and service account types.
- Role-based access control (RBAC) with a module-wise permission matrix.
- Server-enforced permissions and matching permission-aware UI controls.
- Searchable, sortable, paginated Users, Roles, and Login History tables.
- Secure cookie authentication with short-lived access tokens and rotated refresh sessions.
- CSRF protection, login throttling, account locking, password-reset tokens, and login audit history.
- MySQL schema managed through versioned TypeORM migrations—not a SQL import file.

## Technology

| Area | Choice |
| --- | --- |
| Web application | React 19, TypeScript, Vite, AdminLTE 4 |
| API | NestJS 11, TypeScript |
| Database | MySQL, TypeORM migrations |
| Forms | React Hook Form and Zod |
| Client state | TanStack Query and Redux Toolkit |
| HTTP client | Axios with cookie and CSRF support |
| Authentication | JWT access cookie with hashed, rotated refresh sessions |

## Repository layout

```text
apps/
  api/                  NestJS API, TypeORM entities, migrations, and seed
  web/                  React/Vite administration interface
packages/
  shared-types/         Shared application types
docs/
  project-scope.md      Architecture decisions and delivery scope
schema.sql              Legacy CodeIgniter schema reference only
```

## Quick start

### Prerequisites

- Node.js and pnpm 11
- A MySQL database

### 1. Install dependencies

```powershell
pnpm install
```

### 2. Configure the API

Copy the template, then edit `apps/api/.env` with your local database credentials.

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

At minimum, set these values:

```env
DATABASE_ENABLED=true
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cias_react_dev
DB_USER=cias_dev
DB_PASSWORD=your_database_password

# Use a long, unique random value in every environment.
JWT_ACCESS_SECRET=replace_with_a_long_random_secret

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_strong_password
WEB_ORIGIN=http://localhost:5180
```

> The runtime and TypeORM migrations read **only** `apps/api/.env`. The repository-root `.env` is not used. Never commit a real `.env` file.

### 3. Create the database and apply migrations

Create the empty database named in `DB_NAME`, then run:

```powershell
pnpm migration:run
pnpm seed
```

The seed creates the default permissions, the **System Administrator** role, and the administrator account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

### 4. Start development

```powershell
pnpm dev
```

| Service | Address |
| --- | --- |
| Web app | http://localhost:5180 |
| API | http://localhost:3000 |
| Health check | http://localhost:5180/api/health |

Sign in with the seeded administrator credentials. New accounts and administrator-reset accounts must change their password before entering the administration area.

## Common commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start web app and API together |
| `pnpm dev:web` | Start only the React web app |
| `pnpm dev:api` | Start only the NestJS API |
| `pnpm build` | Build every workspace package |
| `pnpm migration:run` | Apply pending database migrations |
| `pnpm migration:revert` | Revert the most recent migration |
| `pnpm seed` | Create/update the default administrator and permissions |
| `pnpm audit --prod` | Check production dependencies for known vulnerabilities |

## Core workflows

### Users

Create, update, activate, or deactivate users. Every user has one account type and one assigned role in the current interface:

- **Regular** — permissions come from assigned roles.
- **System Administrator** — unrestricted access; only another System Administrator can manage this type.
- **Service** — reserved for future integrations and background jobs; currently follows normal role permissions.

### Roles and permissions

Role creation and editing only capture a name and description. Permissions are assigned independently on the Role Details page through a readable module/action matrix. The API is the source of truth: hiding a button in the UI is never relied on for authorization.

### Password recovery email

For local development, leave SMTP values empty and the API logs the reset URL. For real email delivery, configure SMTP values in `apps/api/.env`:

```env
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=...
MAIL_PASSWORD=...
MAIL_FROM_NAME=CIAS Admin
MAIL_FROM_EMAIL=no-reply@example.com
```

Use a local inbox service such as Mailpit for safe reset-email testing. Production SMTP should require TLS and use a dedicated sender account.

## Security model

- Passwords are hashed with bcrypt.
- Password policy: at least 8 characters with a letter, number, and special character.
- Access cookies expire after 15 minutes; hashed refresh sessions rotate and expire after 7 days.
- Logout and password resets revoke affected sessions.
- Mutating requests require a CSRF token.
- Login, password-reset, and refresh endpoints are rate limited.
- Five failed login attempts lock an account for 15 minutes.
- Password-reset tokens are hashed, single-use, and expire after one hour.
- API validation rejects unknown request properties and uses whitelisted sorting fields.

## Before production

- Configure a real SMTP provider and test password-reset delivery.
- Place the web app and API behind HTTPS with an appropriate reverse proxy.
- Use strong, environment-specific secrets and restricted database credentials.
- Set up backups, monitoring, error tracking, and a documented migration procedure.
- Run browser-based end-to-end tests for authentication, RBAC, user management, role permissions, and password recovery.

## Project scope

See [docs/project-scope.md](docs/project-scope.md) for the detailed architecture decisions, completed work, and remaining roadmap.
