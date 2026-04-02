# FMS — Development Plan
Fleet Management System | UAE | AED | Asia/Dubai | Render (BE) + Vercel (FE)

---

## Stack
| | |
|---|---|
| Backend | Rust, Actix-web, single `fms` crate, DDD vertical slices |
| Frontend | React + Vite, shadcn/ui, Tailwind, Framer Motion, Recharts |
| Database | Supabase (PostgreSQL + Realtime + Storage) |
| Auth | Supabase Auth — invite-only, magic link |
| Email | Resend |
| State | Zustand + TanStack Query |
| PDF | printpdf (Rust, server-side) |
| Forms | React Hook Form + Zod |

## Architecture
Each feature = vertical slice (domain → application → infrastructure → presentation).
No feature imports another. Cross-feature contracts via `common/ports.rs`. `main.rs` is the only DI root.

---

## ✅ Sprint 0 — Setup (DONE)
**Backend** — `cargo check` clean, git → portal.vv.backend
- [x] Full DDD structure, config.rs, common/, database/, 14 feature stubs
- [x] migrations/0001_initial_schema.sql (all tables, enums, RLS, defaults)
- [x] /health endpoint, seed-admin CLI, render.yaml, .env.example

**Frontend** — git → portal.vv.frontend
- [x] Vite + React + TS, Tailwind + FMS tokens, shadcn/ui, Satoshi font
- [x] Framer Motion, Zustand, TanStack Query, Supabase SDK, React Router
- [x] lib/utils.ts, lib/api.ts, lib/supabase.ts (logo URL stored)
- [x] vercel.json, .env.example, Supabase agent skills

---

## ✅ Sprint 1 — Auth & Invite (DONE)
**Backend**
- [x] `auth/domain` — Invite entity, AuthRepository trait (+list_profiles)
- [x] `auth/application` — invite, accept, revoke, resend, forgot-password use cases
- [x] `auth/infrastructure` — SupabaseAdminClient (create_user, disable/enable, generate_recovery_link), PgAuthRepository
- [x] `auth/presentation` — handlers + DTOs, routes
- [x] `notification/` — ResendClient, NotificationService (invite + reset emails)
- [x] `audit/` — AuditService append-only audit_log writer (actor_id, actor_role, entity, action)
- [x] Routes: POST /users/invite, PUT /users/invites/:id/revoke, POST /users/invites/:id/resend
- [x] Routes: POST /auth/accept-invite, POST /auth/forgot-password, GET /auth/me, GET /users, GET /users/invites
- [x] JWT middleware: CurrentUser FromRequest extractor (HS256, Supabase JWT, async profile lookup)
- [x] RoleGuard: require_role() helper, returns 403 on mismatch
- [x] seed-admin: full CLI (Supabase Admin API + profiles insert)

**Frontend**
- [x] Login page (Supabase signInWithPassword + /auth/me)
- [x] Accept invite page (token from URL, set name + password)
- [x] Forgot password page (calls backend, shows confirmation)
- [x] User management page (users table + invites table, invite modal, revoke/resend, expiry countdown)
- [x] Auth store (Zustand persist — session, user, role)
- [x] Protected route wrapper (Supabase session sync, role redirect)
- [x] AppLayout sidebar (role-filtered nav, user avatar, sign out)

---

## ✅ Sprint 2 — Driver & Vehicle (DONE)
**Backend**
- [x] `driver/` — Driver entity, CRUD, soft-deactivate (enforce no active vehicle), driver_edits log
- [x] `vehicle/` — Vehicle entity, CRUD, assign/unassign (1 driver at a time), service history, insurance alert
- [x] All /drivers and /vehicles routes

**Frontend**
- [x] Driver list (card grid, search, filter), Create/Edit modal (salary type dropdown), deactivate
- [x] Driver detail (tabbed: Profile | Trips | Financials | Advances | Leave | Audit)
- [x] Vehicle list (card grid, status badges, insurance countdown), Create/Edit, Assign/Unassign modal
- [x] Vehicle detail (service history, assignment history)

---

## Sprint 3 — Trip & Finance
**Backend**
- [ ] `trip/` — Trip entity, dual-entry logic, daily cap, CSV import (preview + confirm), conflict detection
- [ ] `finance/` — cash handover, expense entry, receipt upload to Supabase Storage
- [ ] All /trips and /finance + /expenses routes

**Frontend**
- [ ] Trip entry form (Admin: any driver; Driver: own only)
- [ ] CSV bulk upload with preview table + error report download
- [ ] Cash handover form, expense form with receipt upload
- [ ] Finance summary per driver

---

## Sprint 4 — Advance Module
**Backend**
- [ ] `advance/` — full lifecycle, implements DeductionPort, carry-forward, cycle locking, 1-pending limit
- [ ] All /advances routes

**Frontend**
- [ ] Advance request form (Driver Portal)
- [ ] Kanban dashboard (Pending | Approved | Paid), Approve/Reject/Pay actions

---

## Sprint 5 — HR Module
**Backend**
- [ ] `hr/` — leave/permission lifecycle, overlap validation, bulk approve
- [ ] All /hr/requests routes

**Frontend**
- [ ] Leave/Permission request form (Driver Portal)
- [ ] HR dashboard — timeline view, filters, approve/reject with reason

---

## Sprint 6 — Invoice & PDF
**Backend**
- [ ] `invoice/` — printpdf generation, Type 1 + Type 2/3 layouts, Supabase Storage upload
- [ ] INV-YYYY-MM-NNNN numbering, all /invoices routes

**Frontend**
- [ ] PDF preview (react-pdf), download + print, email action

---

## Sprint 7 — Reports, Audit UI & Settings
**Backend**
- [ ] `report/` — all report types, CSV/Excel/PDF export, pagination, full-text search
- [ ] `settings/` — key-value store, all routes (Super Admin full, Accountant salary-only)
- [ ] `audit/` UI — paginated, searchable, filterable, exportable

**Frontend**
- [ ] Reports page (all types + export), Audit log page, Settings page (split by role)

---

## Sprint 8 — Driver Portal
- [ ] Fully isolated routing, RLS + ownership checks on all driver endpoints
- [ ] My Profile, My Earnings, My Cash, My Salary Slips, My Advances, My Leave, My Notifications
- [ ] Supabase Realtime subscriptions, mobile responsive, Framer Motion polish

---

## Sprint 9 — Salary Module
**Backend**
- [ ] `salary/` — 3 formulas (commission/target_high/target_low), Stage 1→2 (formula → advance deduction)
- [ ] Server always re-computes on save, salary_type_snapshot + constants snapshot at generation
- [ ] Idempotent generation, manual + auto trigger (pay_cycle_day), all salary routes

**Frontend**
- [ ] Salary form (driver + month, type-specific inputs, real-time intermediates display-only)
- [ ] Salary history per driver

---

## Sprint 10 — Dashboard, Uber Stub & QA
- [ ] Dashboard: 4 KPI cards, Realtime, alert banners, per-driver panel, charts, top/bottom performers, filters
- [ ] `uber/` — UberTripSource stub (no-op, implements TripSourcePort)
- [ ] Playwright E2E, performance check (dashboard P99 < 300ms), UAT, prod deploy

---

## Business Rules (Never Break)
- Driver cannot be deactivated with active vehicle
- Advances/salaries append-only once paid/generated
- audit_log, driver_edits, vehicle_service — no UPDATE/DELETE ever
- Server always re-runs salary formula on save
- SEED_KEY removed from env after first Super Admin
- Invite tokens: single-use, hash-only in DB
- All money: NUMERIC(12,2) AED | Timestamps: UTC stored, Dubai displayed | Dates UI: DD/MM/YYYY
- Drivers cannot access other drivers' data
