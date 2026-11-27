# Mini Helpdesk System (MERN)

Users raise support tickets; administrators triage, respond to and resolve them.

| Layer    | Stack |
|----------|-------|
| Backend  | Node.js, Express 4, Mongoose (MongoDB), JWT in an **httpOnly cookie**, zod validation |
| Frontend | React 18 (Vite), Redux Toolkit, axios, react-router, js-cookie |

---

## 1. Quick start

**Prerequisites:** Node 18+, a running MongoDB (local or Atlas).

```bash
# --- backend ---
cd server
cp .env.example .env          # then edit MONGO_URI / JWT_SECRET
npm install
npm run dev                   # http://localhost:5000

# --- frontend (new terminal) ---
cd client
npm install
cp .env.example .env
npm run dev                   # http://localhost:5173
```

Default admin (from `.env.example`): `admin@helpdesk.com` / `Admin@12345` — change it.
Customers sign up themselves on `/register`.

The Vite dev server proxies `/api` to `http://localhost:5000`, so browser and API share one
origin and the auth cookie "just works" (no CORS/SameSite configuration needed in dev).

---

## 2. Features

**Authentication & roles**
- Register / login / logout, `GET /auth/me` for session restore.
- JWT stored in an `httpOnly` cookie (JavaScript cannot read it); `SameSite`, `Secure` (prod).
- Two roles: `user` and `admin`. Public registration can only create `user`; admins are created with `npm run seed:admin`.

**Tickets (user)** – create, list (own), view, edit & delete (only while `open`), track status, comment.
**Tickets (admin)** – list all, filter by status / priority / category / requester, search, sort, paginate, change status & priority (inline or on the detail page), view details + comments, respond to any ticket, delete.
**Comments** – attached to a ticket and an author; owner and admins only. Customers can't comment on closed tickets.
**Event-driven workflow** – see section 4. Activity log per ticket + global admin feed, and in-app notifications with an unread badge.

---

## 3. Architecture

```
server/src
├── config/        env validation, DB connection
├── models/        User, Ticket, Comment, ActivityLog, Notification
├── validators/    zod schemas (request contracts)
├── middleware/    auth (protect / restrictTo), validate, error handler, rate limit
├── routes/        URL -> middleware chain -> controller
├── controllers/   thin HTTP layer (req/res only)
├── services/      business rules, access control, event publishing
└── events/        eventBus + listeners (activity log, notifications)

client/src
├── api/           axios instance (withCredentials, 401 interceptor)
├── store/         Redux Toolkit slices: auth, tickets, admin, notifications, ui
├── components/    Navbar, guards, table, filters, comments, timeline, ...
└── pages/         Login, Register, MyTickets, TicketFormPage, TicketDetail, Admin*
```

Request flow: `route → validate (zod) → protect → restrictTo(role) → controller → service → model`.
Services own the rules ("only open tickets can be edited", "users only see their tickets") so they hold regardless of which controller calls them.

### Data model

| Collection | Key fields |
|---|---|
| `User` | name, email (unique), password (bcrypt, `select:false`), role |
| `Ticket` | title, description, category, priority, status, createdBy → User, resolvedAt, priorityWeight (for sorting) |
| `Comment` | ticket → Ticket, author → User, authorRole, message |
| `ActivityLog` | type, ticket, ticketTitle (snapshot), actor, actorName, actorRole, message, metadata |
| `Notification` | recipient → User, type, ticket, message, isRead |

Indexes: `Ticket {createdBy, createdAt}`, `{status, priority}`, `{createdAt}`; `Comment {ticket}`; `ActivityLog {ticket}`, `{createdAt}`; `Notification {recipient, isRead, createdAt}`.

---

## 4. Event handling

Services publish domain events **after** the DB write succeeds; listeners react independently.
Listeners are isolated — a failing listener is logged and never breaks the user's request.

| Event | Emitted when | Actions |
|---|---|---|
| `ticket.created` | a user submits a ticket | activity log · notify all admins |
| `ticket.updated` | a user edits a ticket, or an admin changes priority | activity log · notify the other party |
| `ticket.status_changed` | an admin changes status | activity log · notify the ticket owner |
| `comment.added` | a user or admin comments | activity log · notify the other party (owner ⇄ admins) |
| `ticket.resolved` | status becomes `resolved` | activity log · notify the owner |
| `ticket.deleted` | a ticket is deleted | activity log (survives deletion) · notify the owner if an admin deleted it |

Implementation: `server/src/events/eventBus.js` (Node `EventEmitter` wrapper: `publish` / `subscribe`) and `server/src/events/listeners.js`.
Swapping the in-process bus for a real queue (BullMQ, SQS, Kafka…) only touches `eventBus.js`.

---

## 5. REST API

All routes are prefixed with `/api`. Responses look like `{ success, data, pagination? }`; errors like `{ success:false, message, errors? }`.

### Auth
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/auth/register` | public | creates a `user`, sets cookie |
| POST | `/auth/login` | public | sets cookie |
| POST | `/auth/logout` | public | clears cookie |
| GET | `/auth/me` | authenticated | current user |

### Tickets
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/tickets` | user | own tickets. Query: `page, limit, q, status, priority, category, sortBy, order` |
| POST | `/tickets` | user | `title, description, category, priority` |
| GET | `/tickets/:id` | owner or admin | others get 404 |
| PATCH | `/tickets/:id` | owner (user) | only while `open` |
| DELETE | `/tickets/:id` | owner (user) | only while `open` |
| GET | `/tickets/:id/comments` | owner or admin | |
| POST | `/tickets/:id/comments` | owner or admin | users blocked on `closed` tickets |
| GET | `/tickets/:id/activity` | owner or admin | event timeline |

### Admin (role = admin)
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/tickets` | all tickets; same filters as above plus `createdBy` |
| PATCH | `/admin/tickets/:id` | `{ status?, priority? }` |
| DELETE | `/admin/tickets/:id` | |
| GET | `/admin/stats` | counts by status & priority |
| GET | `/admin/users` | customers (for the requester filter) |
| GET | `/admin/activity` | global activity feed, paginated |

### Notifications (own only)
`GET /notifications` · `PATCH /notifications/:id/read` · `PATCH /notifications/read-all`

---

## 6. Security notes

- **JWT in httpOnly cookie** → not readable by XSS. The role is *not* trusted from the token: the user is re-loaded from the DB on each request.
- A small non-sensitive cookie (`hd_user`: id, name, email, role) is kept by the frontend via `js-cookie` purely so the UI can render instantly after a reload; the server never trusts it and `/auth/me` verifies the session on boot.
- **Authorization** is enforced server-side (`restrictTo` + ownership checks in the service). Frontend route guards are only UX.
- Passwords: bcrypt (cost 12), min 8 chars with letter + number. Login errors don't reveal whether the email exists.
- **Mass-assignment protection:** zod strips unknown keys (e.g. `role`, `status` in a user's request body are ignored).
- **NoSQL-injection protection:** every input is validated as a typed value (`{"$ne":null}` for an email is rejected); search input is regex-escaped.
- `helmet`, CORS locked to `CLIENT_URL` with credentials, 10 kb JSON body limit, rate limiting (stricter on login/register).
- Other users' tickets return `404` (not `403`) to avoid leaking their existence.
- CSRF: cookie is `SameSite=Lax`, the API only accepts JSON, and CORS is restricted. If you deploy client and API on different sites (`SameSite=None`), add a CSRF token.

---

## 7. Design decisions & possible next steps

- **Edit/delete rule:** customers may modify a ticket only while it is `open` (i.e. before staff started on it). Admins can delete any ticket.
- **Closed tickets:** customers can't comment; admins still can.
- **Notifications** use short polling (30 s). WebSockets/SSE would make them instant.
- **Activity refresh** in the UI waits ~400 ms after an action, because listeners run asynchronously.
- Ideas: ticket assignment to specific agents, attachments, email notifications as another listener, refresh tokens, automated tests.

---

## 8. Environment variables (`server/.env`)

| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | long random string (≥ 32 chars in production) |
| `SESSION_DAYS` | lifetime of JWT + cookie (default 1) |
| `CLIENT_URL` | React app origin, used for CORS |
| `COOKIE_SAMESITE` | `lax` (default) / `strict` / `none` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | used by `npm run seed:admin` |

Optional client env: `VITE_API_URL` (defaults to `/api` via the Vite proxy), `VITE_PROXY_TARGET`.
