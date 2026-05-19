# Goal Setting & Tracking Portal MVP

An enterprise-ready SaaS prototype for organizational goal setting and tracking, built for Hackathons.

## Overview
This platform allows:
- **Employees** to create, manage, and submit quarterly goals (must equal 100% weightage).
- **Managers** to review, approve, and reject team goals inline.
- **Admins** to oversee organization-wide completion rates, quarterly trends, and goal lifecycle distributions using rich analytics.

## Tech Stack
- **Framework**: Next.js 15 (App Router, Server Actions)
- **Database**: PostgreSQL (via Supabase) + Prisma ORM
- **Authentication**: Auth.js (NextAuth v5) - Mocked credentials for demo purposes
- **UI / Styling**: Tailwind CSS v4, shadcn/ui, Recharts
- **Icons**: Lucide React

## Local Setup

### Prerequisites
- Node.js >= 18
- PostgreSQL Database

### Installation

1. Install dependencies
```bash
npm install
```

2. Set up environment variables
Create a `.env` file in the root:
```env
# Example using Supabase
DATABASE_URL="postgresql://postgres.[ID]:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ID]:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-random-string-for-local-dev"
```

3. Initialize Database & Seed
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

4. Run the development server
```bash
npm run dev
```

## Demo Accounts
The seed script provisions 3 mock accounts that require NO password (click to login):
- **Employee**: `employee@demo.com`
- **Manager**: `manager@demo.com` 
- **Admin**: `admin@demo.com`

## Features & Implementation Details
- **Role-based Dashboards**: Conditional UI rendering based on the active user session.
- **Form Validations**: Server-side validations using Zod schema for Goal constraints (Max 8, Min 10%, Total 100%).
- **Interactive UI**: Leverages `sonner` for toast notifications and generic loading/submitting button states.
- **Analytics**: Beautiful Recharts integration displaying real-time aggregated stats of the Prisma PostgreSQL database.
