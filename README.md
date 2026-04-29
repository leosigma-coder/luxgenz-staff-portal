# Luxgenz Staff Portal

A private staff management dashboard for Luxgenz. Built with Next.js, TypeScript, Tailwind CSS, and Turso (cloud SQLite).

**Live Site:** https://luxgenzstaff.xyz

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** SQLite via @libsql/client (supports both local file and Turso cloud)
- **Auth:** JWT sessions (jose) stored in httpOnly cookies
- **Password Hashing:** bcryptjs
- **Deployment:** Netlify (serverless functions)

---

## Getting Started

### Local Development (SQLite File)

```bash
npm install 
npm run dev
```

The app runs at **http://localhost:3000**.

On first launch, the database (`staff.db`) is auto-created with the owner account:

- **Username:** `Luxgenz`
- **Password:** `R3bound`

### Production (Turso Cloud)

1. **Install Turso CLI**
   ```bash
   winget install chiselapp.Turso
   ```

2. **Login and Create Database**
   ```bash
   turso auth login
   turso db create staff-portal
   turso db show staff-portal
   ```

3. **Set Environment Variables**
   Create `.env.local`:
   ```
   TURSO_DATABASE_URL=your-turso-database-url
   TURSO_AUTH_TOKEN=your-turso-auth-token
   ```

4. **Run the App**
   ```bash
   npm run dev
   ```

---

## Pages

### Login (`/`)

- Simple login form — all users log in here.
- Redirects to `/dashboard` on success.

### Dashboard (`/dashboard`)

A sidebar-based layout with icon navigation on the left:

| Icon | Page | Route |
|------|------|-------|
| Grid | Overview | `/dashboard/overview` |
| People | Accounts | `/dashboard` |
| Checklist | Tasks | `/dashboard/tasks` |
| Document | Updates | `/dashboard/updates` |
| Calendar | Events | `/dashboard/events` |
| Book | Docs | `/dashboard/docs` |
| Pen | Audit Logs | `/dashboard/logs` (admin+) |

Clicking a username anywhere navigates to `/dashboard/users/[id]` (Staff Profile).

Below the nav icons:

- **Bell icon** — opens the notification panel (priority-styled alerts)
- **Search icon** — opens the command palette (also `Ctrl+K`)
- **Sign Out** — logs out the current user

---

## Accounts Page (`/dashboard`)

Displays a table of all staff accounts with columns:

- **Username** (with copy-to-clipboard button)
- **Staff Role** (color-coded badge)
- **Last PW Reset** (owner only — shows date of last password reset)
- **Actions** (owner only)

### Owner Actions

- **Create Account** — pick a username, auto-generate or set a password, and choose a granular staff role. A temporary password is shown once for copying.
- **Change Role** — reassign any non-owner user to a different staff role.
- **Reset Password** — auto-generate or manually set a new password. The new password is shown once for copying.
- **Delete** — remove a non-owner account (with confirmation).

### Admin Actions

- **Create Account** — can only assign staff-level roles (Builder through Helper).

### Staff Actions

- View the account list only. No creation or management.

---

## Staff Role Hierarchy

Roles are split into two auth levels. The `role` column tracks auth level (`owner`/`admin`/`staff`), while `staff_role` stores the granular role.

### Admin-Level Roles

| Role | Badge Color |
|------|-------------|
| Executive | Purple |
| Management | Purple |
| Staff Management | Blue |
| Developer | Red |
| Administrator | Red |

### Staff-Level Roles

| Role | Badge Color |
|------|-------------|
| Builder | Pink |
| Sr Mod | Cyan |
| Mod | Cyan |
| Jr Mod | Teal |
| Helper | Green |

### Owner

- Only one owner exists (`Luxgenz`). Cannot be deleted or reassigned.
- Shown with an **Amber** badge.

---

## Updates Page (`/dashboard/updates`)

A feed of announcements and changelogs, newest first.

### Posting an Update (Owner Only)

The "Post Update" modal includes:

- **Title** — required
- **Category** — General, New Feature, Bug Fix, Improvement, Announcement, Maintenance
- **Priority** — Low, Normal, High, Critical
- **Version** — optional (e.g. `1.0.0`)
- **Content** — required, free-text body

Posting an update automatically sends a notification to all staff.

### Viewing Updates (All Staff)

Each update card shows:

- Category badge (color-coded)
- Priority label (shown if not "Normal")
- Version tag (if provided)
- Title, author, and timestamp
- Full content body

### Deleting Updates (Owner Only)

Each card has a **Delete** button visible only to the owner.

---

## Events Page (`/dashboard/events`)

A list of events sorted by date, split into **Upcoming** and **Past** sections.

### Creating an Event (Owner Only)

The "Create Event" modal includes:

- **Title** — required
- **Event Type** — General, Tournament, Meeting, Training, Maintenance
- **Description** — required
- **Date** — required (date picker)
- **Time** — optional (time picker)

Creating an event automatically sends a notification to all staff.

### Viewing Events (All Staff)

Each event card shows:

- Event type badge (color-coded)
- Date badge (month + day)
- Title and optional time
- Description
- Author name
- **RSVP buttons** — Attending / Not Attending
- List of users who are attending

Past events appear dimmed.

### Deleting Events (Owner Only)

Each card has a **Delete** button visible only to the owner.

---

## Tasks Page (`/dashboard/tasks`)

A Kanban-style task assignment system with three columns: **Todo**, **In Progress**, **Done**.

### Creating Tasks (Owner + Admin)

- **Title** — required
- **Description** — optional
- **Priority** — Low, Normal, High, Critical
- **Assigned To** — pick any staff member
- **Due Date** — optional

Assigned users receive a notification (critical priority tasks get a critical-level notification).

### Working with Tasks (All Staff)

- Move tasks between columns using status buttons.
- Filter by: **All Tasks**, **My Tasks**, **Overdue**.
- Filter by status: Todo, In Progress, Done.
- Overdue tasks are highlighted with a red ring.

### Deleting Tasks (Owner + Admin)

Each task card has a **Delete** button.

---

## Docs Page (`/dashboard/docs`)

Internal staff documentation / private wiki. Documents are organized by category and displayed in a card grid.

### Categories

- Rules, Commands, Procedures, Staff Guidelines, General

### Creating / Editing Docs (Owner + Admin)

- **New Document** button opens a full editor with title, category, and content fields.
- Content is written in a monospace text editor.
- Documents can be edited by any admin+ user; edits track the `updated_by` field.
- **Save as Draft** or **Create/Publish** — drafts are only visible to admin+ users.

### Viewing Docs (All Staff)

- Click a doc card to view full content.
- Filter by category using the filter pills at the top.
- Each doc shows author, last editor, and update timestamp.
- Draft docs show an amber "Draft" badge (visible to admin+ only).

### Deleting Docs (Owner Only)

Available from the doc detail view.

---

## Audit Logs Page (`/dashboard/logs`)

A full activity tracking system. Admin+ only.

### Tracked Actions

- `USER_CREATE`, `USER_DELETE`, `ROLE_CHANGE`, `PASSWORD_RESET`
- `DOC_CREATE`, `DOC_EDIT`, `DOC_DELETE`, `DOC_PUBLISH`
- `EVENT_CREATE`, `EVENT_DELETE`
- `UPDATE_CREATE`, `UPDATE_DELETE`, `UPDATE_PUBLISH`
- `TASK_CREATE`, `TASK_UPDATE`, `TASK_DELETE`
- `LOGIN`

### Filters

- By action type
- By user
- Paginated (50 per page)

Each log entry shows the action badge, target, performer, metadata details, and timestamp.

---

## Staff Profiles (`/dashboard/users/[id]`)

Click any username to view their profile page.

### Profile shows:

- Avatar initial, username, role badge
- Join date, last login, created by
- **Bio** — editable by the user themselves or admin+
- **Stats** — total tasks, tasks done (%), events attending, activity log count
- **Recent Tasks** — last 5 assigned tasks with status
- **Recent Activity** — last 10 audit log entries for that user

---

## Notifications

A real-time notification system accessed via the bell icon in the sidebar.

- Notifications are created automatically when updates, events, or tasks are posted.
- **Priority levels:** `info` (default), `warning`, `critical`
- Critical notifications have a red accent and badge. Warning notifications have amber.
- Each notification shows a title, message, priority badge, timestamp, and unread indicator.
- Clicking a notification marks it as read and navigates to the relevant page.
- **Mark all read** button clears all unread badges.
- Notification count badge on the bell icon shows unread count (polls every 30s).

---

## Draft Mode (Updates & Docs)

Both updates and docs support saving as drafts before publishing.

- **Save Draft** button in the create modal saves without notifying anyone.
- **Publish** button on draft cards makes them visible to all staff and sends notifications.
- Draft items show an amber "Draft" badge.
- Staff users cannot see draft updates or docs.

---

## Command Palette (`Ctrl+K`)

A spotlight-style search overlay for quick page navigation.

- Triggered by `Ctrl+K` (or `Cmd+K` on Mac) or clicking the search icon in the sidebar.
- Type to filter pages by name or keywords (includes Tasks and Audit Logs).
- Press `Escape` to dismiss.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      # POST - authenticate user
│   │   │   ├── logout/route.ts     # POST - clear session cookie
│   │   │   └── session/route.ts    # GET  - return current session
│   │   ├── users/route.ts          # GET, POST, DELETE, PATCH - account CRUD
│   │   ├── users/[id]/route.ts     # GET, PATCH - user profile + bio
│   │   ├── tasks/route.ts          # GET, POST, PATCH, DELETE - task CRUD
│   │   ├── updates/route.ts        # GET, POST, PATCH, DELETE - updates + drafts
│   │   ├── events/route.ts         # GET, POST, PATCH, DELETE - events + RSVP
│   │   ├── notifications/route.ts  # GET, PATCH - notifications
│   │   ├── docs/route.ts           # GET, POST, PATCH, DELETE - docs + drafts
│   │   ├── audit-logs/route.ts     # GET - audit log queries
│   │   └── plugin/
│   │       ├── webhook/route.ts    # POST - receive plugin events
│   │       ├── sync/route.ts       # POST - server heartbeat
│   │       └── stats/route.ts      # GET  - dashboard overview stats
│   ├── dashboard/
│   │   ├── layout.tsx              # Sidebar, notifications, command palette
│   │   ├── overview/page.tsx       # Dashboard overview with server status
│   │   ├── page.tsx                # Accounts page
│   │   ├── tasks/page.tsx          # Tasks page (Kanban board)
│   │   ├── updates/page.tsx        # Updates page (with drafts)
│   │   ├── events/page.tsx         # Events page (with RSVP)
│   │   ├── docs/page.tsx           # Docs page (with drafts)
│   │   ├── logs/page.tsx           # Audit Logs page
│   │   └── users/[id]/page.tsx     # Staff Profile page
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Login page
│   └── globals.css                 # Tailwind import
├── lib/
│   ├── auth.ts                     # JWT session create/verify helpers
│   └── db.ts                       # SQLite schema, all DB functions
```

---

## Database Tables

### `users`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| username | TEXT | Unique |
| password_hash | TEXT | bcrypt hash |
| role | TEXT | `owner`, `admin`, or `staff` |
| staff_role | TEXT | Granular role (e.g. `executive`, `mod`) |
| created_by | TEXT | Username of creator |
| created_at | TEXT | ISO datetime |
| last_password_reset | TEXT | ISO datetime of last reset |
| last_login | TEXT | ISO datetime of last login |
| bio | TEXT | Optional bio/notes |

### `updates`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| title | TEXT | Required |
| content | TEXT | Required |
| category | TEXT | `general`, `feature`, `bugfix`, `improvement`, `announcement`, `maintenance` |
| priority | TEXT | `low`, `normal`, `high`, `critical` |
| version | TEXT | Optional, e.g. `1.0.0` |
| status | TEXT | `draft` or `published` |
| author | TEXT | Username of poster |
| created_at | TEXT | ISO datetime |

### `events`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| title | TEXT | Required |
| description | TEXT | Required |
| event_date | TEXT | `YYYY-MM-DD` |
| event_time | TEXT | Optional, `HH:MM` |
| event_type | TEXT | `general`, `tournament`, `meeting`, `training`, `maintenance` |
| author | TEXT | Username of creator |
| created_at | TEXT | ISO datetime |

### `event_rsvps`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| event_id | INTEGER | FK → events.id (cascade delete) |
| user_id | INTEGER | FK → users.id |
| status | TEXT | `attending` or `not_attending` |
| | | Unique on (event_id, user_id) |

### `notifications`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| user_id | INTEGER | FK → users.id (cascade delete) |
| type | TEXT | `update`, `event`, etc. |
| title | TEXT | Notification title |
| message | TEXT | Short description |
| link | TEXT | Optional URL path |
| priority | TEXT | `info`, `warning`, or `critical` |
| is_read | INTEGER | 0 = unread, 1 = read |
| created_at | TEXT | ISO datetime |

### `docs`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| title | TEXT | Required |
| content | TEXT | Required |
| category | TEXT | `rules`, `commands`, `procedures`, `guidelines`, `general` |
| status | TEXT | `draft` or `published` |
| author | TEXT | Username of creator |
| updated_by | TEXT | Username of last editor |
| created_at | TEXT | ISO datetime |
| updated_at | TEXT | ISO datetime |

### `tasks`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| title | TEXT | Required |
| description | TEXT | Optional |
| priority | TEXT | `low`, `normal`, `high`, `critical` |
| status | TEXT | `todo`, `in_progress`, `done` |
| assigned_to | INTEGER | FK → users.id (cascade delete) |
| created_by | TEXT | Username of creator |
| due_date | TEXT | Optional, `YYYY-MM-DD` |
| created_at | TEXT | ISO datetime |
| updated_at | TEXT | ISO datetime |

### `audit_logs`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| action | TEXT | e.g. `USER_CREATE`, `LOGIN` |
| target | TEXT | Username, doc title, etc. |
| performed_by | TEXT | Username of performer |
| metadata | TEXT | JSON string with extra details |
| created_at | TEXT | ISO datetime |

### `server_status`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Always 1 (singleton) |
| online_players | INTEGER | Current player count |
| max_players | INTEGER | Server max slots |
| tps | REAL | Server TPS |
| online_staff | TEXT | JSON array of staff names |
| staff_in_modmode | TEXT | JSON array |
| staff_vanished | TEXT | JSON array |
| frozen_players | TEXT | JSON array |
| panic_mode | INTEGER | 0 or 1 |
| chat_enabled | INTEGER | 0 or 1 |
| uptime_seconds | INTEGER | Server uptime |
| server_version | TEXT | e.g. `Paper 1.21.1` |
| last_heartbeat | TEXT | ISO datetime of last sync |

### `plugin_events`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| event_type | TEXT | e.g. `PUNISHMENT`, `MODMODE_ENABLE`, `STAFF_JOIN` |
| actor | TEXT | Who performed the action |
| target | TEXT | Who was affected |
| reason | TEXT | Optional reason |
| duration | TEXT | Optional duration string |
| metadata | TEXT | JSON extra data |
| server | TEXT | Server name |
| created_at | TEXT | ISO datetime |

### `mc_punishments`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| punishment_type | TEXT | `ban`, `mute`, `warn`, `kick` |
| player | TEXT | Punished player name |
| player_uuid | TEXT | Minecraft UUID |
| issued_by | TEXT | Staff who issued it |
| reason | TEXT | Optional reason |
| duration | TEXT | e.g. `7d`, `perm` |
| active | INTEGER | 1 = active, 0 = expired/revoked |
| created_at | TEXT | ISO datetime |
| expires_at | TEXT | ISO datetime or null for permanent |

### `mc_reports`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| reporter | TEXT | Player who reported |
| target | TEXT | Reported player |
| reason | TEXT | Report reason |
| server | TEXT | Server name |
| world | TEXT | World name |
| handled | INTEGER | 0 = open, 1 = handled |
| handled_by | TEXT | Staff who handled it |
| created_at | TEXT | ISO datetime |

### `mc_cases`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| case_id | TEXT | Unique case ID (e.g. `#1001`) |
| player | TEXT | Player name |
| player_uuid | TEXT | Minecraft UUID |
| offense | TEXT | Offense type |
| status | TEXT | `OPEN`, `CLOSED`, `APPEALED` |
| assigned_to | TEXT | Assigned staff |
| notes | TEXT | Case notes |
| evidence | TEXT | Evidence links |
| created_by | TEXT | Staff who created it |
| created_at | TEXT | ISO datetime |
| updated_at | TEXT | ISO datetime |

### `mc_staff_stats`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| username | TEXT | Unique, staff name |
| mc_uuid | TEXT | Minecraft UUID |
| total_punishments | INTEGER | Total punishments issued |
| warnings_issued | INTEGER | Warnings count |
| mutes_issued | INTEGER | Mutes count |
| bans_issued | INTEGER | Bans count |
| kicks_issued | INTEGER | Kicks count |
| reports_handled | INTEGER | Reports handled count |
| modmode_time_mins | INTEGER | Minutes in mod mode |
| playtime_mins | INTEGER | Total playtime minutes |
| last_online | TEXT | ISO datetime |
| updated_at | TEXT | ISO datetime |

---

## Plugin Integration

The staff portal connects to the Minecraft Staff Plugin via HTTP API. The plugin sends real-time events and periodic heartbeats to the website.

### Setup

1. In the plugin's `config.yml`, add:

```yaml
web_portal:
  enabled: true
  url: "https://luxgenzstaff.xyz"
  api_key: "luxgenz-plugin-key-2024"
  sync_interval: 30
```

2. Rebuild and restart the plugin. It will begin sending heartbeats every 30 seconds.

3. The plugin will send real-time data to your live site including:
   - Server status (players, TPS, uptime)
   - Online staff list with modmode/vanish status
   - Punishments, reports, and cases
   - Staff statistics and activity

### API Endpoints (Plugin → Website)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/plugin/sync` | POST | `x-api-key` | Server heartbeat (players, TPS, staff status) |
| `/api/plugin/webhook` | POST | `x-api-key` | Event webhook (punishments, reports, cases, staff activity) |
| `/api/plugin/stats` | GET | JWT session | Dashboard overview stats (used by the frontend) |

### Webhook Event Types

The plugin sends JSON payloads with `{ "type": "EVENT_TYPE", "data": { ... } }`:

- **PUNISHMENT** — ban, mute, warn, kick issued
- **UNPUNISHMENT** — unban, unmute
- **REPORT** — new player report
- **REPORT_HANDLED** — report resolved
- **CASE_CREATE** / **CASE_UPDATE** — moderation case lifecycle
- **STAFF_STATS** — bulk staff statistics update
- **MODMODE_ENABLE** / **MODMODE_DISABLE** — staff mod mode toggle
- **VANISH_ENABLE** / **VANISH_DISABLE** — staff vanish toggle
- **FREEZE** / **UNFREEZE** — player freeze
- **STAFF_JOIN** / **STAFF_LEAVE** — staff login/logout
- **PANIC_ENABLE** / **PANIC_DISABLE** — server panic mode
- **CHAT_TOGGLE** / **CLEAR_CHAT** / **CLEARLAG** — server management
- **WATCHLIST_ADD** / **WATCHLIST_REMOVE** — watchlist changes
- **PLAYER_JOIN** / **PLAYER_LEAVE** — player joins/leaves

### Dashboard Overview (`/dashboard/overview`)

The overview page displays:

- **Server Status Banner** — online/offline indicator, player count, TPS, staff count, uptime, panic/chat/freeze alerts
- **Stats Cards** — staff count, overdue tasks, upcoming events, open reports, active bans, open cases, draft updates, total punishments
- **Tasks Summary** — progress bars for todo/in-progress/done
- **Recent Portal Activity** — latest audit log entries
- **Recent Server Events** — latest plugin events (punishments, mod mode, etc.)
- **Recent Logins** — last 5 portal logins
- **Online Staff** — list with mod mode and vanish indicators

Data refreshes automatically every 30 seconds.

---

## Security Notes

- **No plaintext passwords are stored.** Passwords are hashed with bcrypt only.
- Temporary passwords are generated on account creation and password resets — shown once, then discarded.
- The `last_password_reset` column tracks when each user's password was last changed.
- **Full audit logging** — every significant action is tracked with actor, target, and metadata.
- **Plugin API authentication** — plugin endpoints require an API key via `x-api-key` header.
- JWT sessions are stored in httpOnly cookies (not accessible via JS).
- Only the owner can create admin-level accounts, manage roles, reset passwords, delete accounts, post updates, create events, and delete docs.
- Admins can create staff-level accounts, create/edit docs, and manage tasks.
- Staff have read-only access (plus RSVP to events and updating their own task status).
