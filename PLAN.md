# Goal Setting & Tracking Portal MVP - Implementation Plan

## Overview
A production-quality hackathon MVP for an enterprise Goal Setting & Tracking Portal. It will have a modern SaaS feel (like Linear, Notion, Vercel dashboards) with a dark theme first, utilizing a modern Next.js 15 stack.

## Tech Stack
- **Frontend**: Next.js 15 App Router, TypeScript, TailwindCSS, shadcn/ui, Framer Motion, React Hook Form, Zod
- **Backend**: Next.js Route Handlers / Server Actions
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: Auth.js (NextAuth) v5
- **Charts**: Recharts
- **Hosting Target**: Vercel + Supabase Postgres

## Design System
- **Style**: Modern SaaS, Minimal, Elegant, Enterprise-ready, Dark theme first.
- **Colors**: Indigo (#4F46E5), Cyan (#06B6D4), Emerald (#10B981).
- **Backgrounds**: Slate-900, Gray-900.
- **Components**: rounded-2xl cards, subtle gradients, light glassmorphism, clean spacing.
- **Typography**: Inter font.

## Core Workflows & Rules
1. **Employee**: 
   - Create up to 8 goals.
   - Minimum 10% weightage per goal.
   - Total weightage must be exactly 100%.
   - Submit goals (transitions from Draft -> Submitted).
   - Enter quarterly updates (Q1-Q4) with statuses (Not Started, On Track, Completed).
2. **Manager**:
   - Review submitted goals, edit weightages/targets inline, and Approve (locks goals).
   - Review quarterly check-ins and provide comments.
3. **Admin**:
   - View Org-wide Analytics (Completion heatmaps, QoQ charts, Goal distribution).
   - Manage Cycles and Goal unlocking.
   - Push "Shared KPIs" to employees.

## Database Schema (Prisma)
- **User**: id, name, email, role (EMPLOYEE, MANAGER, ADMIN), managerId.
- **Goal**: id, title, description, target, weightage, status (DRAFT, SUBMITTED, APPROVED, LOCKED), ownerId, isShared.
- **CheckIn**: id, quarter (Q1, Q2, Q3, Q4), progress, status, employeeComment, managerComment, goalId.
- **AuditLog**: id, action, entity, entityId, userId, timestamp.

## Implementation Phases

### Phase 1: Setup & Scaffolding
- Initialize Next.js 15 project with Tailwind and TypeScript.
- Setup Prisma, Supabase connection, and NextAuth.
- Configure shadcn/ui and fonts (Inter).
- Setup dark mode and global CSS (slate-900/gray-900 backgrounds, custom primary colors).

### Phase 2: Database & Seed
- Define Prisma schema.
- Create seed script with `employee@demo.com`, `manager@demo.com`, `admin@demo.com` and initial realistic data.
- Run migrations and seed the database.

### Phase 3: Core UI Components
- Layouts: Sidebar navigation, Topbar, Dashboard layout wrappers.
- Reusable UI: Cards, Progress Bars, Status Chips, Framer Motion wrappers.

### Phase 4: Employee Flow
- Dashboard: Overview of goals and progress.
- Goal Management: Create, edit, validate (100% total, max 8), and submit goals.
- Check-ins: Quarterly update form.

### Phase 5: Manager Flow
- Team Dashboard: View direct reports.
- Approvals: Review submitted goals, inline edit, and approve.
- Check-ins Review: Add manager comments to Q updates.

### Phase 6: Admin Flow & Analytics
- Dashboard with Recharts (QoQ, heatmaps, distributions).
- Audit logs view.

### Phase 7: Polish & Demo Prep
- Add toast notifications, loading skeletons, optimistic UI.
- Final visual polish and responsive checks.
- Update README with setup instructions.
