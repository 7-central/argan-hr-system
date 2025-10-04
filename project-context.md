# Argan HR Consultancy - Project Context

**Last Updated:** 2025-10-04
**System Version:** v2.0
**Status:** Production - Phase 2 Complete

---

## Quick Overview

**What is this?** An internal admin dashboard for Argan HR Consultancy staff to manage their client portfolio, replacing legacy SharePoint with a modern, secure client management system.

**Who uses it?** Internal staff only (Kim, Ric, Sue) - not client-facing.

**Where is it?** Production: https://argan-hr-system.vercel.app/admin

---

## Business Context

### The Company

**Argan HR Consultancy** (7Central Argan HR Consultancy Ltd) is a small HR consultancy in North West England that helps SMEs with employment law compliance, policy management, and HR support.

**The Transition Story:**

- Originally a one-person operation run by Sue (employment law expert)
- Acquired 12 months ago by Ric George through his holding company 7Central
- Sue transitioned to paid consultant role, her daughter Kim joined as HR Administrator
- Moving from informal, relationship-based operations to professional, systemized service delivery

**Current Client Base:**

- 6 active clients total
- 5 legacy clients from Sue's era (informal arrangements)
- 1 new client (PAS) with proper contract structure

**Service Model:**

- Monthly retainers (£100+ base tier)
- Policy management and updates
- HR support and employment law advice
- Compliance and document management

### The Problem This System Solves

Before this system, client data lived in:

- An unorganized 10GB SharePoint drive (nobody knew what was in it)
- Sue's head (institutional knowledge)
- Various scattered files and folders

No formal data protection agreements, policies hadn't been systematically updated in years, and everything relied on Sue remembering things.

**This system provides:**

- Centralized client database with proper structure
- Service tier and contract tracking
- Secure, GDPR-compliant data management
- Foundation for scaling beyond 6 clients to 50+ clients

---

## Technical Stack

### Core Technologies

| Component      | Technology                         | Version  |
| -------------- | ---------------------------------- | -------- |
| Framework      | Next.js (App Router)               | 15.5.3   |
| Language       | TypeScript                         | ^5       |
| React          | React 19 with Server Components    | 19.1.0   |
| Database       | Neon PostgreSQL                    | Latest   |
| ORM            | Prisma                             | 6.16.2   |
| UI Library     | shadcn/ui + Tailwind CSS           | v4       |
| Hosting        | Vercel                             | Latest   |
| Authentication | Custom session-based (AES-256-GCM) | Built-in |

### Architecture Pattern

**Three-layer architecture:**

1. **Infrastructure Layer** (`lib/system/`) - Database, config, logging, health checks
2. **Business Layer** (`lib/business/`) - Services, business logic, domain errors
3. **Presentation Layer** (`app/`, `components/`) - UI, forms, API routes

### Key Dependencies

- `bcryptjs` (3.0.2) - Password hashing (12 rounds)
- `jose` (6.1.0) - Session encryption
- `zod` (4.1.11) - Schema validation
- `react-hook-form` (7.63.0) - Form handling
- `lucide-react` (0.544.0) - Icons
- `sonner` (2.3.1) - Toast notifications

---

## Database Schema

### Core Tables

**admins** - System users

```typescript
{
  id: string (UUID)
  email: string (unique)
  passwordHash: string
  name: string
  role: AdminRole (SUPER_ADMIN | ADMIN | VIEWER)
  isActive: boolean
  failedLoginAttempts: number
  lastFailedAttempt: DateTime?
  lockedUntil: DateTime?
}
```

**clients** - HR consultancy clients (companies)

```typescript
{
  id: string (UUID)

  // Business Info
  companyName: string
  businessId: string?
  sector: string?

  // Service Classification
  serviceTier: ServiceTier (TIER_1 | DOC_ONLY | AD_HOC)
  monthlyRetainer: Decimal?

  // Primary Contact
  contactName: string
  contactEmail: string
  contactPhone: string?

  // Contract
  contractStartDate: Date?
  contractRenewalDate: Date?

  // Status
  status: ClientStatus (ACTIVE | INACTIVE | PENDING)

  // Metadata
  createdBy: string? (Admin ID)
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## Key Features

### 1. Authentication & Security ✅

- Custom session-based authentication (no third-party auth service)
- AES-256-GCM encrypted sessions in HTTP-only cookies
- Progressive rate limiting (exponential backoff on failed logins)
- Role-based access control (SUPER_ADMIN, ADMIN, VIEWER)
- Account lockout after repeated failed attempts
- OWASP security headers and CSP compliance

### 2. Client Management ✅

- Full CRUD operations for client records
- Service tier tracking (Tier 1, Doc Only, Ad Hoc)
- Contract and renewal date management
- Search and filtering capabilities
- Soft delete (status-based, not hard delete)
- Optimistic UI updates for instant feedback

### 3. Dashboard ✅

- Client count and growth metrics
- Service tier distribution
- Recent client activity
- Quick actions and navigation
- Professional loading states and skeletons

### 4. User Management ✅

- Admin user creation and management
- Role assignment and permissions
- Active/inactive status control
- Password security requirements enforced

### 5. UX Polish ✅

- React 19 optimistic updates for form submissions
- Professional skeleton loading states
- Toast notifications for user feedback
- Error boundaries for graceful error handling
- Responsive design (mobile-first)
- Dark mode support (next-themes)

---

## File Structure

```
argan-hr-system/
├── app/                          # Next.js App Router
│   ├── admin/
│   │   ├── (auth)/              # Unauthenticated routes
│   │   │   └── login/           # Login page
│   │   └── (protected)/         # Protected routes (auth required)
│   │       ├── clients/         # Client management
│   │       ├── users/           # Admin user management
│   │       ├── layout.tsx       # Auth check + sidebar layout
│   │       └── page.tsx         # Dashboard
│   ├── api/                     # API routes
│   │   ├── auth/               # Login/logout endpoints
│   │   ├── clients/            # Client CRUD endpoints
│   │   └── health/             # System health monitoring
│   └── layout.tsx              # Root layout
│
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── clients/                # Client-specific components
│   ├── dashboard/              # Dashboard components
│   ├── forms/                  # Form components
│   ├── loading/                # Loading states
│   └── app-sidebar.tsx         # Main navigation
│
├── lib/
│   ├── system/                 # Infrastructure layer
│   │   ├── config.ts           # Environment config
│   │   ├── database.ts         # Prisma connection
│   │   ├── errors.ts           # System errors
│   │   ├── health.ts           # Health checks
│   │   └── logger.ts           # Structured logging
│   ├── business/               # Business logic layer
│   │   ├── services/
│   │   │   ├── client.service.ts    # Client operations
│   │   │   └── dashboard.service.ts # Dashboard metrics
│   │   └── errors/             # Business error types
│   ├── auth/                   # Authentication utilities
│   ├── middleware/             # Request middleware
│   ├── db.ts                   # Prisma client export
│   └── utils.ts                # Shared utilities
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Version-controlled migrations
│   └── seed.ts                 # Initial data seeding
│
└── hooks/                      # Custom React hooks
```

---

## Authentication Flow

### Login Process

1. User submits email + password at `/admin/login`
2. Server validates credentials with bcryptjs hash comparison
3. Rate limiting check (progressive backoff on failures)
4. Success → Create AES-256-GCM encrypted session token
5. Set HTTP-only cookie with 4-hour expiration
6. Redirect to `/admin` dashboard

### Route Protection

- **Pattern**: Route groups with layout-based protection
- **Unauthenticated routes**: `app/admin/(auth)/` - login, public pages
- **Protected routes**: `app/admin/(protected)/` - everything else
- **Auth check**: `app/admin/(protected)/layout.tsx` validates session
- **Redirect**: Invalid session → `/admin/login?redirect=[original-path]`

### Session Management

- **Storage**: HTTP-only, Secure, SameSite cookies
- **Duration**: 4 hours
- **Encryption**: AES-256-GCM with 32-byte hex secret
- **Secret**: `ADMIN_SESSION_SECRET` environment variable

---

## Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed initial data (creates admin@argan.hr)
npm run db:seed

# Start development server (Turbopack)
npm run dev
# → http://localhost:3000/admin/login
```

### Common Commands

```bash
npm run dev              # Development server with hot reload
npm run build            # Production build (must pass for deploy)
npm run lint             # ESLint checks
npm run typecheck        # TypeScript validation
npm run db:studio        # Visual database editor (Prisma Studio)
npm run db:migrate       # Run new migrations
npm run db:reset         # Reset database (destructive!)
```

### Quality Gates

Every deployment must pass:

1. ✅ `npm run typecheck` → 0 errors
2. ✅ `npm run lint` → 0 errors (6 accepted warnings for Phase 2 placeholders)
3. ✅ `npm run build` → Success
4. ✅ Manual testing of admin flows in browser

---

## Environment Variables

### Required Variables

```bash
# Database (Neon PostgreSQL connection string)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Authentication (32-byte hex for AES-256-GCM encryption)
ADMIN_SESSION_SECRET="your-32-byte-hex-secret-here"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Dev
NEXT_PUBLIC_APP_URL="https://argan-hr-system.vercel.app"  # Prod
```

### Default Credentials (Seeded)

- **Email**: `admin@argan.hr`
- **Password**: `ChangeMe123!`
- **Role**: SUPER_ADMIN

---

## Deployment

### Production Environment

- **URL**: https://argan-hr-system.vercel.app/admin
- **Platform**: Vercel (7-central Pro team)
- **Auto-Deploy**: Push to `main` branch → automatic build & deploy
- **Database**: Neon PostgreSQL (serverless, Vercel-integrated)
- **Build Time**: ~2-3 minutes

### Repository

- **GitHub**: https://github.com/7-central/argan-hr-system
- **Access**: Private repository (7-central organization)
- **Branch**: `main` for production

---

## Important Context for AI Agents

### What This System Is NOT

- ❌ Not a client-facing portal (internal staff use only)
- ❌ Not for managing policies or documents (just client metadata)
- ❌ Not using Clerk (custom auth implementation)
- ❌ Not using AWS (fully Vercel-native)
- ❌ Not the marketing website (that's separate, planned but not built yet)

### What This System IS

- ✅ Internal admin dashboard for staff
- ✅ Client relationship management (CRM-lite)
- ✅ Service tier and contract tracking
- ✅ Foundation for scaling operations
- ✅ Modern replacement for legacy SharePoint chaos

### Current State (Phase 2 Complete)

- **Stories 1.1-1.8**: Core platform with auth, clients, users ✅
- **Stories 2.0-2.5**: UX polish, optimistic updates, security hardening ✅
- **Quality**: Zero technical debt, all quality gates passing ✅
- **Production**: Live and actively used by Kim and Ric ✅

### Future Roadmap (Not Yet Implemented)

- Policy management and tracking
- Document storage integration
- Automated policy review reminders
- Email notification system
- Client self-service portal
- Compliance calculator for lead generation
- Marketing website integration

### Working with This Codebase

1. **Always read existing code first** - Patterns are established, follow them
2. **Respect the layered architecture** - Don't bypass the service layer
3. **Validate with Zod** - All user input must be validated
4. **Test in browser** - Quality gates + manual testing required
5. **Check auth context** - Most pages need authenticated admin access
6. **Use Prisma Studio** - Visual database editor is your friend (`npm run db:studio`)

### Common Pitfalls to Avoid

- ❌ Don't hard-code database queries in components (use services)
- ❌ Don't skip Zod validation on user input
- ❌ Don't create new auth patterns (use existing session utils)
- ❌ Don't bypass the middleware stack (use composed middleware)
- ❌ Don't forget optimistic updates for form submissions

---

## Contact & Support

**Primary Developer**: Lee Hayton (AI and Automations)
**Business Owner**: Ric George (7Central)
**Primary User**: Kim (HR Administrator)
**Employment Law Expert**: Sue (Consultant)

---

**Note**: This document provides current technical context for AI agents. For business strategy, marketing plans, and future features, see `argan_business_context/business_story.md` (note: parts of that document reflect past iterations and may be outdated for technical implementation).
