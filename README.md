# CIAS — React + NestJS Admin Panel

This repository is a TypeScript monorepo for the rewrite of the CodeIgniter user-management admin panel.

## Applications

- `apps/web` — React, Vite, Redux Toolkit, TanStack Query, AdminLTE styling
- `apps/api` — NestJS, TypeORM, MySQL-ready API
- `packages/shared-types` — shared permission and API types

## Local development

Install dependencies once:

```bash
pnpm install
```

Start both applications:

```bash
pnpm dev
```

The web app runs at `http://localhost:5173`; the API runs at `http://localhost:3000`.

The API deliberately starts with its database connection disabled until `DATABASE_ENABLED=true` and database credentials are supplied in `apps/api/.env`.

## Database migrations

The TypeORM migration foundation is in `apps/api/src/database/migrations`. When a MySQL development database is ready, set `DATABASE_ENABLED=true` in `apps/api/.env` and run:

```bash
pnpm migration:run
```

`schema.sql` is the legacy CodeIgniter schema reference only; it is not used by the new application.

## First administrator

After the initial migration, add a unique `JWT_ACCESS_SECRET` and an `ADMIN_PASSWORD` with at least 8 characters, including a letter, number, and special character, to `apps/api/.env`. Then run:

```bash
pnpm seed
```

This creates the System Administrator role, the default permissions, and the account identified by `ADMIN_EMAIL` (default: `admin@example.com`). The generated password is never committed to Git.

## Password-reset email

Set the SMTP values in `apps/api/.env` to deliver password-reset email in production:

```env
WEB_ORIGIN=https://admin.example.com
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=...
MAIL_PASSWORD=...
MAIL_FROM_NAME=CIAS Admin
MAIL_FROM_EMAIL=no-reply@example.com
```

For local development, leave `MAIL_HOST` and `MAIL_FROM_EMAIL` empty to log the reset URL in the API terminal, or point them at a local SMTP test inbox such as Mailpit.
