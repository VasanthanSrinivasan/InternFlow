# InternFlow – Internship & Learning Portal (React + json-server)

Full CRUD app: login/register/logout, sidebar + topbar, React Router pages,
Home + Dashboard showing the logged-in user's data. Data lives in `data/db.json`
and is accessed with **axios** through **json-server** (same method as the social-media tutorial).
Only `useEffect` / `useState` are used (no `useMemo`).

## Run

```bash
npm install
npm run dev        # starts json-server (port 3500) + Vite together
```

Open the URL Vite prints (http://localhost:5173).
Separate terminals instead: `npm run server` and `npm run client`.
Reset demo data any time: `npm run seed`.

## Demo logins

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@internflow.com   | Admin@123    |
| Trainer | ravi@internflow.com    | Trainer@123  |
| Student | arun@example.com       | Student@123  |

"Create account" on the Register page always creates a **student**.
Admins create trainers in **Users** (sidebar, admin only).

## Learning workflow

1. **Trainer/Admin** adds a course in **Course Studio**, then opens the video icon (or "Manage videos" on the Course Library card) to add / edit / remove YouTube, Vimeo or .mp4 video links. Works for existing and new courses.
2. **Student** clicks **Enroll now** in Course Library. Status = *Pending*.
3. **Trainer/Admin** approves in **Enrollments** (or enrolls a student directly).
4. Only after approval the course appears in the student's **My Learning**, lessons unlock and tasks appear in **My Tasks**.
5. Trainer/Admin creates tasks, tests and assignments in **Assessments**.
6. Student submits (text + optional link). Trainer/Admin reviews and grades in **Submissions**.
7. **Enrollments** dashboard shows every student, course, approval status, progress and completion status. **Reports** exports everything.

## Downloads (CSV / Excel / PDF)

* Enrollments page and Submissions page: download exactly what the filters show.
* Reports page: 9 reports + one complete workbook (Excel sheet or PDF section per report).
* Reports and the staff dashboards are available to **admin and trainer only** (also blocked on the route level).

## What each role can do

| Page | Admin / Trainer | Student |
|------|-------|---------|
| Openings | add / edit / delete | view, **Apply** |
| Applications | see all, change decision, delete | see own, withdraw |
| Mentors | add / edit / delete | view |
| Attendance | daily register, mark all present, CSV | own history |
| Evaluations | add / edit / delete | own feedback |
| Course Library | add courses/videos, preview | browse, **Enroll** |
| Course Studio, Enrollments, Assessments, Submissions, Reports | **admin + trainer** | hidden / blocked |
| Users & Roles | admin only | hidden / blocked |
| My Learning, My Tasks | hidden | approved courses only |
| Home, Dashboard, Profile | yes (global data) | yes (own data) |

## Structure

```
data/db.json            json-server database
scripts/seed.mjs        rebuilds db.json
src/api/client.js       axios instance (baseURL http://localhost:3500)
src/context/            AuthProvider (login, register, logout, session restore)
src/components/auth/    ProtectedRoute, GuestRoute
src/components/layout/  MainLayout, Sidebar, Topbar
src/pages/              Login, Register, Home, Profile, Mentors
src/features/           dashboard, openings, applications, attendance, evaluations, learning
src/features/staff/     Enrollments, Assessments, Submissions, Reports, Users
src/utils/exporters.js  CSV / Excel / PDF downloads
src/utils/reportData.js report datasets shared by the pages
```

## CRUD pattern used everywhere

```js
useEffect(() => { const fetchX = async () => { const r = await api.get('/x'); setX(r.data) }; fetchX() }, [])
await api.post('/x', body)     // Create
await api.put('/x/1', body)    // Update (full)
await api.patch('/x/1', part)  // Update (partial)
await api.delete('/x/1')       // Delete
```

## Styling (CSS layers, loaded in this order)

| File | Purpose |
|------|---------|
| `src/index.css` | base design system (layout, tables, forms, cards) |
| `src/extras.css` | auth pages, user menu, modals, home/profile |
| `src/professional.css` | KPI cards, filters, badges, reports, tasks |
| `src/theme.css` | **the "feel" layer**: aurora background, frosted sticky topbar, cursor spotlight on cards, shine buttons, rotating glow border, scroll-driven reveals, skeleton loaders, springy modals |

Count-up numbers come from `components/common/AnimatedNumber.jsx`. Page entrance animations replay on every route change (`MainLayout`).
Everything respects "reduce motion" and falls back gracefully in older browsers. To tone it down, remove the `import "./theme.css"` line in `src/main.jsx`.

## Notes

- Passwords are stored as salted SHA-256 hashes, but json-server is a **mock** server:
  every record (including hashes) is readable and the session is just the user id in localStorage.
  For production, build a real backend (Node/Express + MongoDB + JWT).
- Videos are links (YouTube / Vimeo / .mp4). json-server cannot store video files; upload to YouTube (unlisted) or a host and paste the link.
- Student submissions are text + an optional link (GitHub, Drive, Figma). File uploads need a real backend.
- If the API is down you will see "Cannot reach the API server" – run `npm run server`.
