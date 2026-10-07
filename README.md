# NovaWorks CRM - AI Meeting to Project CRM

## Team

- Team: **404 Brain**
Team Leader: Muhammad Abdullah
Team Memeber: Haseeb Alam


## What Works

Custom JWT login, ten seeded users, Admin/Manager/Agent access enforced in each API route, read-only team directory, project/task screens, OpenRouter transcript extraction, schema/role/date/hour validation, and atomic PostgreSQL imports. An Admin sees all work; a manager sees their projects and tasks; an agent sees only their own tasks and the relevant parent projects. There is no signup, cost calculation or progress monitoring.

## Technology Stack

Next.js 14.2.35 App Router, TypeScript, React 18, Tailwind CSS, local shadcn/ui components, Supabase-hosted PostgreSQL through `pg`, OpenRouter, `jose`, and `bcryptjs` cost 10. Supabase Auth is not used. Credentials are never sent to the AI. Query values use parameters, and import writes run in one database transaction.

## Demo Login Accounts

| Role | Login | Password |
| --- | --- | --- |
| Admin | Admin or admin@novaworks.example | admin123 |
| Manager | ayesha@novaworks.example | Demo123! |
| Manager | bilal@novaworks.example | Demo123! |
| Manager | hina@novaworks.example | Demo123! |
| Agent | ali@novaworks.example | Demo123! |
| Agent | hamza@novaworks.example | Demo123! |
| Agent | sara@novaworks.example | Demo123! |
| Agent | usman@novaworks.example | Demo123! |
| Agent | zain@novaworks.example | Demo123! |
| Agent | maryam@novaworks.example | Demo123! |








## Documentation

- https://supabase.com/docs/guides/database/connecting-to-postgres
- https://node-postgres.com/features/ssl
- https://openrouter.ai/docs
