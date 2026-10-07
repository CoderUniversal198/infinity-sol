# Verification record

Prepared 7 October 2026. These results describe this source package, not an online deployment.

| Check | Result | Boundary |
| --- | --- | --- |
| Next.js production build | PASS | Next.js 14.2.35, all application pages and API routes compiled |
| TypeScript | PASS | Strict `tsc --noEmit`, including test and setup scripts |
| Automated tests | 18 PASS | Plan validation, dates, roles, JWT expiry/tampering and PostgreSQL transaction rollback |
| HTTP integration | 14 groups PASS | Actual production Next.js server, PGlite PostgreSQL; simulated pg transport and OpenRouter |
| All ten logins | PASS | Requested Admin alias/password and fictional demo accounts, bcrypt cost 10; secure, HttpOnly, SameSite=Lax, 24-hour cookies |
| Seed repeated twice | PASS | Ten rows and unchanged account UUIDs |
| Admin/manager/agent scope | PASS | Every seeded account checked through list and detail API routes |
| Direct unauthorized project request | PASS | Returns 403, not another user's task data |
| Unknown/forged session | PASS | Returns 401 |
| Non-admin transcript creation | PASS | Returns 403 before AI processing |
| Non-admin transcript page | PASS | Redirects to dashboard |
| Password/hash exposure | PASS | Team and session responses exclude hashes; AI directory excludes passwords |
| Invalid AI output | PASS | Malformed JSON, external assignee and provider rate limit do not insert records |
| Reference pipeline | PASS with simulated AI | 3 projects, 12 tasks and 124 hours saved through the actual API and transaction |
| Changed-input pipeline | PASS with simulated AI | Changed QuickServe estimate/date persist; not proof of real model extraction accuracy |
| Atomic rollback | PASS | A failure in the second project rolls back every new project/task in the batch |
| Direct browser database roles | PASS | Anonymous and authenticated Supabase roles cannot query tables or invoke the import function |
| Fresh requests | PASS | Saved rows remain available across new HTTP requests |
| Database role changes | PASS | Handler rechecks current account role even with an earlier admin JWT |
| Logout | PASS | Cookie is cleared with Max-Age=0 |
| Browser bundle secret scan | PASS | Database connection, AI key and JWT secret are absent from generated browser JavaScript |
| Real OpenRouter extraction | NOT RUN | Key configured; no paid calls made during this update; `npm run test:live-ai` is supplied |
| Hosted Supabase PostgreSQL | UNVERIFIED | Read-only connection attempt failed DNS resolution in this environment; no live schema or records were changed |
| Browser visual/interaction QA | NOT RUN | Responsive source and SSR route checks do not substitute for browser QA |
| GitHub/Vercel deployment | NOT RUN | Accounts not connected; no repository or live URL was created |
| Dependency security audit | NOT CLEAN | Existing Next.js 14 dependency findings remain; see README |

The functional tests do not establish production security or prove arbitrary-transcript semantic correctness. The private changed-files archive intentionally includes the supplied credentials in `.env.local`. It contains only files changed from the original project. Database records, generated build files and dependencies are excluded. Keep this archive private.

The supplied Next.js 14 requirement leaves unresolved upstream advisories, including critical findings. Upgrade to a patched supported framework and remediate affected dependencies before public production deployment. No audit or deployment safety checks have been bypassed.
