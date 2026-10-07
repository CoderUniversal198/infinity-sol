# NovaWorks CRM - AI Meeting to Project CRM

Turn meeting discussions into structured projects, clear task ownership, and saved work plans.

NovaWorks CRM is an AI-assisted project management application developed by 404 Brain for The Infinity Hack '26. An administrator pastes a meeting transcript, and the application extracts the final project decisions, validates the resulting plan, and saves the projects and tasks to PostgreSQL. Each team member then sees the work permitted by their role.

---

## Team

**Team: 404 Brain**

| Name | Role |
| --- | --- |
| Muhammad Abdullah | Team Leader |
| Haseeb Alam | Team Member |

---

## Project Overview

Meeting transcripts often contain several projects, proposed deadlines, revised estimates, and changes in task ownership. Turning these discussions into a reliable work plan usually requires someone to read the meeting carefully and enter the final decisions manually.

We built NovaWorks CRM to connect that meeting discussion directly to project execution. The application brings together authentication, a predefined team directory, AI extraction, validation, database persistence, and role-specific project views.

The main objective is a working flow:

> Sign in → Paste a transcript → Extract and validate the plan → Save projects and tasks → View assigned work.

The project focuses on project details, task assignments, deadlines, and estimated effort. Signup, cost calculation, and progress monitoring are outside the current scope.

---

## What Works

| Feature | What we implemented |
| --- | --- |
| Custom authentication | JWT-based login and logout using the application's own user records. Supabase Auth is not used. |
| Ten seeded accounts | One administrator, three managers, and six developer agents are available for the demonstration. |
| API-level authorization | Protected API routes check the authenticated user and enforce the corresponding role and ownership restrictions. |
| Team directory | A read-only view of the supplied team members, roles, specializations, and skills. |
| Administrator workspace | Access to all projects and tasks, with the ability to create work from a meeting transcript. |
| Manager workspace | Access to the manager's assigned projects and the tasks within those projects. |
| Agent workspace | Access to the agent's assigned tasks and the relevant parent project information. |
| Project and task screens | Project details include the client, manager, deadline, and task list. Tasks show their title, description, owner, deadline, and estimated hours. |
| AI transcript extraction | OpenRouter processes the transcript and team directory to produce a structured project plan. |
| Plan validation | The application checks output structure, required fields, employee references, roles, dates, and estimated hours before saving. |
| Atomic database imports | All projects and tasks in an import are written within one PostgreSQL transaction. A failed import does not leave a partly saved plan. |
| Persistent records | Saved work is stored in PostgreSQL and remains available after a page refresh or a later login. |
| Clear interface feedback | Loading, success, empty, and error states communicate what is happening during the workflow. |

---

## Roles and Permissions

Authorization applies to data requests as well as the visible interface. Hiding a button or filtering a screen is not the only access control.

| Action or information | Admin | Manager | Agent |
| --- | --- | --- | --- |
| Sign in and sign out | Yes | Yes | Yes |
| View the read-only team directory | Yes | Yes | Yes |
| Create projects from a transcript | Yes | No | No |
| View projects | All projects | Assigned projects only | Projects containing their assigned tasks only |
| View tasks | All tasks | All tasks within their assigned projects | Their own assigned tasks only |
| Open project details directly | Any project | Assigned projects only | Relevant parent projects only, with tasks filtered to that agent |
| Access another user's unrelated work | Yes, as administrator | No | No |

For example, Ali Raza can see his UrbanCart tasks and the associated project details, but not Hamza's task in that same project. Ayesha Khan, as the UrbanCart manager, can see all tasks within UrbanCart, but not an unrelated manager's project.

---

## Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Application framework | Next.js 14.2.35, App Router | Application pages and backend API routes |
| Language | TypeScript | Typed application logic and data structures |
| Interface | React 18 | Interactive forms and role-specific screens |
| Styling | Tailwind CSS | Consistent, responsive layouts |
| UI components | Local shadcn/ui components | Reusable interface components maintained in the project |
| Database | Supabase-hosted PostgreSQL | Persistent users, projects, and tasks |
| Database driver | `pg` / node-postgres | Server-side PostgreSQL queries and transactions |
| AI provider | OpenRouter | Access to the configured model for transcript extraction |
| Session signing | `jose` | JWT creation and verification |
| Password hashing | `bcryptjs`, cost factor 10 | Hashing and checking account passwords |

Supabase is used as the PostgreSQL host. Authentication is handled by the application through `jose` and `bcryptjs`.

---

## How the Application Works

**1. Sign in and identify the user**

The user submits their login credentials. The backend checks the stored password hash and establishes a signed JWT session. Subsequent protected requests use that session to identify the user and their role.

The application determines access from the authenticated session, not from a role or user ID supplied by the caller.

**2. Submit the meeting transcript**

The administrator opens Create from Transcript and submits the complete meeting discussion. The transcript can contain multiple client projects, task assignments, estimates, and later corrections to earlier decisions.

**3. Extract the project plan**

The backend sends the transcript and the relevant team directory to the configured OpenRouter model. The model is asked to return structured project and task data, including existing employee references.

The extraction instructions prioritize final agreed decisions. Proposed work that was explicitly rejected or deferred should not become a task in the current plan.

**4. Validate the complete response**

The application parses the returned data and checks the complete plan before starting the import. Missing or invalid required values produce an understandable error so the transcript can be corrected and submitted again.

**5. Save the complete import**

The backend writes the projects and their linked tasks within one PostgreSQL transaction. Successful imports are committed together; a failure rolls back the transaction.

**6. Display the saved work**

The administrator can review all created projects. Managers and agents can then sign in to see their permitted project and task views. These screens read saved database records, so the results persist after refresh.

---

## AI Extraction and Validation

The AI produces a draft plan. Application validation determines whether that draft is suitable to save.

| Validation area | Rule |
| --- | --- |
| Response structure | The output must contain the expected project and task structure. |
| Required project data | Each project needs a name, client, manager, and valid deadline. |
| Required task data | Each task needs a title, assigned agent, valid deadline, and estimated hours. |
| Existing people | Managers and assignees must resolve to employees in the supplied directory. |
| Role correctness | A project manager must have the Manager role; a task assignee must have the Agent role. |
| Calendar dates | Dates must represent real calendar dates in the expected format. |
| Deadline consistency | A task deadline must not be later than its parent project's deadline. |
| Estimated effort | Estimated hours must be a positive number. Hours represent effort, not elapsed calendar days. |
| Complete import | Invalid required data prevents the entire draft from being saved. |

The transcript instructions also tell the model to preserve distinct tasks and projects, use the final revised values, and exclude outside contacts from employee assignments. These interpretation requirements should be checked during the demonstration; valid JSON alone does not prove that every meeting decision was understood correctly.

Passwords, database credentials, API keys, and session secrets are never included in the AI request.

---

## Database Design

The application uses three main entities.

| Entity | Main information | Relationships |
| --- | --- | --- |
| User | Reference ID, name, login identifier, password hash, role, specialization, and skills | Managers own projects; agents receive tasks. |
| Project | Name, client, description, manager, and deadline | Each project belongs to one manager and contains tasks. |
| Task | Title, description, assigned agent, deadline, and estimated hours | Each task belongs to one project and one agent. |

One manager may manage several projects. One project may contain several tasks. One agent may receive tasks across more than one project.

Query values use parameters rather than being inserted into SQL text. Import writes run in one transaction, preserving the relationship between each project and its tasks.

---

## Demo Login Accounts

| Role | Name | Login | Password |
| --- | --- | --- | --- |
| Admin | Admin | `Admin` or `admin@novaworks.example` | `admin123` |
| Manager | Ayesha Khan | `ayesha@novaworks.example` | `Demo123!` |
| Manager | Bilal Ahmed | `bilal@novaworks.example` | `Demo123!` |
| Manager | Hina Malik | `hina@novaworks.example` | `Demo123!` |
| Agent | Ali Raza | `ali@novaworks.example` | `Demo123!` |
| Agent | Hamza Shah | `hamza@novaworks.example` | `Demo123!` |
| Agent | Sara Noor | `sara@novaworks.example` | `Demo123!` |
| Agent | Usman Tariq | `usman@novaworks.example` | `Demo123!` |
| Agent | Zain Abbas | `zain@novaworks.example` | `Demo123!` |
| Agent | Maryam Asif | `maryam@novaworks.example` | `Demo123!` |

---

## Expected Result for the Supplied Meeting

The supplied NovaWorks planning transcript should produce three projects and twelve tasks.

| Project | Client | Manager | Project deadline | Tasks | Estimated hours |
| --- | --- | --- | --- | --- | --- |
| UrbanCart Website | UrbanCart Clothing | Ayesha Khan | 20 October 2026 | 4 | 40 |
| QuickServe Mobile App | QuickServe Services | Bilal Ahmed | 24 October 2026 | 4 | 46 |
| HelpDeskPro AI Assistant | HelpDeskPro Solutions | Hina Malik | 22 October 2026 | 4 | 38 |

**Expected task assignments**

| Project | Task | Owner | Deadline in 2026 | Hours |
| --- | --- | --- | --- | --- |
| UrbanCart | Product catalog UI | Ali Raza | 12 October | 12 |
| UrbanCart | Demo cart UI | Ali Raza | 15 October | 8 |
| UrbanCart | Product and cart APIs | Hamza Shah | 14 October | 14 |
| UrbanCart | Website integration and testing | Ali Raza | 19 October | 6 |
| QuickServe | Login and profile screens | Sara Noor | 12 October | 8 |
| QuickServe | Service booking screens | Sara Noor | 17 October | 12 |
| QuickServe | Booking and account APIs | Hamza Shah | 16 October | 16 |
| QuickServe | Mobile integration and testing | Usman Tariq | 22 October | 10 |
| HelpDeskPro | FAQ document processing | Maryam Asif | 13 October | 10 |
| HelpDeskPro | Assistant answer generation | Zain Abbas | 17 October | 14 |
| HelpDeskPro | Human escalation flow | Zain Abbas | 18 October | 6 |
| HelpDeskPro | Assistant evaluation and testing | Maryam Asif | 21 October | 8 |

These are verification expectations for the supplied meeting, not a fixed response to reuse for every transcript. Changed final decisions should produce corresponding changes in the extracted plan.

The demonstration should specifically check the revised UrbanCart delivery and integration dates, QuickServe's final 10-hour integration estimate, and Maryam's ownership of HelpDeskPro evaluation. Kamran is an outside contact and must not receive a task.

---

## Run Locally

### Requirements

- Node.js and npm compatible with the project's `package.json`.
- Access to the project's Supabase-hosted PostgreSQL database.
- The appropriate PostgreSQL connection settings for the server environment.
- An OpenRouter API key and an available model.

### Setup

1. Download or clone the project, then open a terminal in its root directory.

2. Install the dependencies:

   ```sh
   npm install
   ```

3. Copy the repository's environment example to the local configuration file.

   Windows PowerShell:
   ```powershell
   Copy-Item .env.example .env.local
   ```

   macOS / Linux:
   ```sh
   cp .env.example .env.local
   ```

4. Fill in the settings defined by that repository's `.env.example`. The application needs a PostgreSQL connection, an OpenRouter key and model, and a JWT signing secret. Keep database credentials and AI keys on the server.

5. Apply the SQL schema or migrations supplied with the project to the Supabase database.

6. Run the demo-account seeder:

   ```sh
   npm run seed
   ```

7. Start the development server:

   ```sh
   npm run dev
   ```

Keep the terminal running and open http://localhost:3000. Sign in with one of the demo accounts above.

> Use the exact environment-variable names and database setup instructions included in the current repository. The `pg` connection requires PostgreSQL connection settings; a Supabase public project URL alone is not a PostgreSQL connection string. Follow the official connection and SSL documentation linked below for the selected connection method.

### Local build

```sh
npm run build
npm run start
```

---

## Demonstration and Acceptance Checks

| Check | Steps | Expected result |
| --- | --- | --- |
| Administrator login | Sign in with `Admin` or the admin email and `admin123`. | The administrator workspace is available. |
| Transcript conversion | Paste the supplied meeting and create the plan. | Three projects and twelve tasks are saved. |
| Final decisions | Compare the output with the reference tables above. | Revised owners, deadlines, and estimates replace earlier proposals. |
| Manager access | Sign in as Ayesha. | Only her assigned project is visible, with its tasks. |
| Agent access | Sign in as Ali. | Only his three assigned UrbanCart tasks are visible. |
| Work across projects | Sign in as Hamza. | His two API tasks appear under UrbanCart and QuickServe. |
| Direct request protection | Request an unrelated project's URL or API endpoint as a manager or agent. | The request is denied; unrelated tasks are not returned. |
| Persistence | Refresh the page, or sign out and sign in again. | The saved projects and tasks remain available. |
| Changed input | Revise QuickServe integration's final estimate and deadline consistently throughout the transcript. | The extracted task reflects the new final values. |
| Invalid plan | Use an unknown employee or omit required information. | A correction is requested and invalid data is not saved. |
| Atomic import | Exercise a controlled database failure during an import. | The import rolls back without partly created projects or tasks. |

These checks describe the expected acceptance behavior. They are not a claim that the updated configuration has been independently retested with live database and AI credentials.

---

## Scope and Limitations

The current version is a focused MVP for converting meeting decisions into saved work assignments.

- Signup, password reset, email verification, and user-management screens are not included.
- Cost calculation, progress monitoring, timesheets, and budgets are not included.
- AI extraction requires a configured model, network access, and sufficient provider availability or quota.
- Ambiguous or incomplete meeting details may require the administrator to correct the transcript and try again.
- Structural validation checks the returned data; reviewing the reference and changed-input demonstrations remains important for checking extraction quality.

---

## Project Links

| Item | Status |
| --- | --- |
| Source repository | Link not supplied for this README |
| Live application | Link not supplied for this README |
| Demo recording | Link not supplied for this README |

---

## Documentation

- [Supabase: Connecting to PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [node-postgres: SSL configuration](https://node-postgres.com/features/ssl)
- [OpenRouter documentation](https://openrouter.ai/docs)
