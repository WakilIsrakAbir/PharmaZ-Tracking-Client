# PharmaZ247 Tracker: web app (client)

The Next.js 16 web app of the PharmaZ247 Tracker, an internal app for the PharmaZ247 marketing team: the dashboard calendar with a details panel, the doctor and pharmacy onboarding forms, the lists, the team page and the account page.

It needs the API from **[PharmaZ-Tracking-Server](https://github.com/WakilIsrakAbir/PharmaZ-Tracking-Server)**. That repository also has [PLAN.md](https://github.com/WakilIsrakAbir/PharmaZ-Tracking-Server/blob/main/PLAN.md) (how the app works) and [TASKS.md](https://github.com/WakilIsrakAbir/PharmaZ-Tracking-Server/blob/main/TASKS.md) (the checklist).

## First-time setup

You need Node.js 22.9 or newer (24 recommended).

1. Install: `npm install`
2. Copy `.env.example` to `.env.local`. It says where the API is (`API_URL=http://localhost:4000`).
3. Start the API (see the server's README), then run `npm run dev` and open http://localhost:3000.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the web app on http://localhost:3000 (an old copy still using port 3000 is stopped first). Requests to `/api/*` go to the API at `API_URL` |
| `npm run lint` | Checks the code |
| `npm run build` | Builds the web app for production (`npm start` then serves it) |

## Folders

| Path | What |
|---|---|
| `src/app/login/` | Sign in (and choose a password at first sign-in) |
| `src/app/(dashboard)/` | Every signed-in page, one folder per URL; each page only picks a component. `page.jsx` here is the dashboard at `/` |
| `src/components/` | One folder per screen part, one component per file. Start with the file named after the folder (e.g. `dashboard/Dashboard.jsx`); the others are its pieces |
| `src/components/app-shell/` | The frame around every signed-in page: `AppShell`, `Sidebar`, `TopBar`, `MainMenu`, `AccountMenu`, plus `useUser` (who is signed in) and `useSidebar` (folding the sidebar) |
| `src/components/auth-shell/` | The sign-in page frame: `AuthShell`, `BrandPanel` |
| `src/components/login/` | `LoginForm`, `ChoosePasswordForm` (first sign-in), `SubmitButton` |
| `src/components/account/` | `ChangePasswordForm` |
| `src/components/dashboard/` | `Dashboard`: `MonthCalendar` → `DayCell` → `VisitChip`, `DayVisits`, `NewFormButtons`; `calendar.js` has the date helpers |
| `src/components/record-details/` | `RecordDetails`: `DetailsCard`, `StatusCard` → `StatusUpdate`, `StatusPicker`, `ImplementationSteps`, `History`, `SubmittedBy`; `FormCard`, `PageActions` |
| `src/components/record-form/` | `RecordForm` (new + edit): `DoctorFields`, `PharmacyFields`, `NumberedField`, `ChoiceChips`, `DaysAndHours`, `TakaInput`, `StatusChoice`, `PhotoPicker`; `values.js` converts between the form and the API |
| `src/components/record-list/` | `RecordList`: `RecordRow`, `RowsSkeleton` |
| `src/components/team/` | `TeamPage`: `UserRow`, `UserActions`, `TeammateDialog`, `CredentialsPanel`, `NoOneShown`, `RowsSkeleton` |
| `src/components/layout/` | `Protected` (who may see a page), `Providers` (data loading + toasts) |
| `src/components/shared/` | Small pieces used on many pages: `PageHeader`, `EmptyState`, `PageSkeleton`, `ServerUnreachable`, `StatusBadge`, `TypeBadge`, `Avatar`, `FormField`, `PasswordInput`, `ConfirmDialog`, `Logo` |
| `src/components/ui/` | The shadcn/ui building blocks (button, input, dialog, …) |
| `src/lib/` | `api.js` (every API call), `session.js` (who is signed in, server side), `format.js` (dates in Dhaka time, phone numbers, taka), `constants.js` (statuses, form field labels) |
| `src/proxy.js` | Sends signed-out visitors to `/login` |

Files with JSX end in `.jsx`; plain JavaScript files end in `.js`.

Before changing Next.js code, read the matching guide in `node_modules/next/dist/docs/` (see `AGENTS.md`). This version has Cache Components on, which changes how cookies, the current time and URL data are read.
