# Architectural Principles & Implementation Guide

## Purpose

This document defines the architectural principles and implementation patterns for the Argan HR System, a Next.js 15 application using:

- **Next.js 15 App Router** with Server Components and Server Actions
- **Prisma ORM** with PostgreSQL
- **TypeScript** for type safety
- **shadcn/ui** for components
- **Clerk** for authentication (future implementation)

These principles ensure:
- Clean separation of concerns
- Type safety across layers
- Proper Server/Client component boundaries
- Serializable data for Client Components
- Maintainable and testable code

**Use this document** when implementing new features, reviewing code, or onboarding agents to ensure consistency with established patterns.

## Table of Contents

### Core Principles
1. [Layer Separation](#1-layer-separation)
2. [Dependency Direction Rules](#2-dependency-direction-rules)
3. [Type Sharing Across Layers](#3-type-sharing-across-layers)
4. [Prisma Decimal Serialization](#4-prisma-decimal-serialization)
5. [Error System Architecture](#5-error-system-architecture)

### Implementation Patterns
6. [Service Layer Implementation](#6-service-layer-implementation)
7. [Hybrid API Approach](#7-hybrid-api-approach-server-actions--api-routes)
8. [Middleware Composition](#8-middleware-composition)
9. [Authentication Patterns](#9-authentication-patterns)
10. [Next.js App Router Patterns](#10-nextjs-app-router-patterns)
11. [API Response Standards](#11-api-response-standards)

### Common Issues
12. [Common Violations and Solutions](#12-common-violations-and-solutions)

### Appendices
- [A. File Organization](#appendix-a-file-organization)
- [B. Implementation Templates](#appendix-b-implementation-templates)
- [C. Decision Trees](#appendix-c-decision-trees)

---

## 1. Layer Separation

### Three-Layer Architecture (Next.js Specific)

```
┌─────────────────────────────────────┐
│           App Layer                 │ ← Pages, components, Server Actions
│    app/*, components/*, lib/hooks/* │
├─────────────────────────────────────┤
│         Business Layer              │ ← Services, business logic
│      lib/services/business/*        │
├─────────────────────────────────────┤
│        Shared & Utilities           │ ← Types, utils, system functions
│   lib/types/*, lib/utils/system/*   │
└─────────────────────────────────────┘
```

### Layer Responsibilities

#### App Layer
- **Location**: `app/`, `components/`, `lib/hooks/`
- **Purpose**: UI, routing, user interactions
- **Examples**: Pages, Client/Server Components, Server Actions
- **Can Import**: Business services, shared types, utilities
- **Cannot Import**: Nothing (top layer)

#### Business Layer
- **Location**: `lib/services/business/`
- **Purpose**: Business logic, domain operations
- **Examples**: ClientService, DashboardService
- **Can Import**: Shared types, utilities, Prisma client
- **Cannot Import**: App layer (pages, components)

#### Shared & Utilities
- **Location**: `lib/types/`, `lib/utils/`, `lib/errors/`
- **Purpose**: Shared definitions, system utilities
- **Examples**: DTOs, error classes, response builders
- **Can Import**: External libraries only
- **Cannot Import**: App or business layers

### Components and Business Logic: Critical Pattern

**Key Rule**: Components can CALL business logic but must NEVER CONTAIN business logic.

#### ✅ What Components CAN Do

```typescript
// ✅ CORRECT: Component directly imports and calls business service
// components/dashboard/metrics.tsx
import { clientService } from '@/lib/services/business/client.service'

export async function DashboardMetrics() {
  const clients = await clientService.getClients({ page: 1, limit: 10 })
  // Use clients in UI
}

// ✅ CORRECT: Component directly imports and calls business utility
// app/admin/(protected)/clients/[id]/page.tsx
import { getContractRenewalUrgency } from '@/lib/utils/business/contract'

export default async function ClientPage({ params }) {
  const client = await clientService.getClientById(params.id)
  const urgency = getContractRenewalUrgency(client.contractRenewalDate)
  // Use urgency in UI
}
```

#### ❌ What Components CANNOT Do

```typescript
// ❌ WRONG: Business logic defined inside component
// components/dashboard/metrics.tsx
export function DashboardMetrics() {
  // VIOLATION: Business logic in component
  const calculateContractRenewalUrgency = (date: Date) => {
    const daysUntilRenewal = Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntilRenewal <= 30) return 'URGENT'
    if (daysUntilRenewal <= 60) return 'WARNING'
    return 'SAFE'
  }
  // This logic should be in /lib/utils/business/contract.ts
}
```

#### Decision: Where Should a Function Live?

**Ask: "Would this logic exist if we switched UI frameworks (React → Vue → Angular)?"**

- **YES** → Business logic → Extract to `/lib/services/business/` or `/lib/utils/business/`
- **NO** → Presentation logic → Can stay in component

**Examples:**

```typescript
// Business Logic (extract to /lib/utils/business/)
function calculateContractRenewalUrgency(date: Date): 'URGENT' | 'WARNING' | 'SAFE'
function validateClientEmail(email: string): boolean
function calculateMonthlyRetainerTotal(clients: Client[]): number

// Presentation Logic (can stay in component)
function getUrgencyColorClass(urgency: string): string  // Maps to CSS classes
function getServiceTierLabel(tier: string): string      // Maps to display labels
function formatCurrency(amount: number): string         // UI formatting
```

### Layer Violation Examples

```typescript
// ❌ BAD: App layer importing implementation details from business services
// app/admin/(protected)/clients/new/page.tsx
import { ClientService } from '@/lib/services/business/client.service' // VIOLATION

// ✅ GOOD: App layer importing from shared types
import type { CreateClientDto } from '@/lib/types/client'

// ❌ BAD: Shared types importing from business or app layers
// lib/types/client.ts
import type { ClientService } from '@/lib/services/business/client.service' // VIOLATION

// ✅ GOOD: Shared types importing from Prisma only
import type { Client as PrismaClient } from '@prisma/client'
```

---

## 2. Dependency Direction Rules

### The Dependency Rule

**Dependencies must only point downward:**

```
App Layer → Business Layer → Shared/Utils
App Layer → Shared/Utils
Business Layer → Shared/Utils
```

### Forbidden Dependencies

```typescript
// ❌ NEVER: Shared/Utils → Business
import { clientService } from '@/lib/services/business/*' // In shared utils

// ❌ NEVER: Shared/Utils → App
import { ClientForm } from '@/components/*' // In shared utils

// ❌ NEVER: Business → App
import { ClientForm } from '@/components/*' // In business services

// ❌ NEVER: Circular dependencies
// A.ts imports B.ts AND B.ts imports A.ts
```

### Allowed Dependencies

```typescript
// ✅ ALWAYS OK: App → Business
import { clientService } from '@/lib/services/business/client.service'

// ✅ ALWAYS OK: App → Shared
import type { CreateClientDto } from '@/lib/types/client'

// ✅ ALWAYS OK: Business → Shared
import type { CreateClientDto } from '@/lib/types/client'
import { ValidationError } from '@/lib/errors'

// ✅ ALWAYS OK: Any layer → External libraries
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
```

---

## 3. Type Sharing Across Layers

### Critical Pattern: Shared Types File

When types need to be shared between app layer (pages/components/Server Actions) and business layer (services), use a shared types file to avoid architectural violations.

#### The Problem: Next.js Server Actions and Type Exports

Next.js Server Actions files (marked with `'use server'`) cannot re-export TypeScript types because Next.js build treats them as runtime values, causing compilation errors.

```typescript
// ❌ PROBLEM: Server Actions cannot re-export types
// app/admin/(protected)/clients/actions.ts
'use server'

export type { CreateClientDto } from '@/lib/services/business/client.service'
// ERROR: Next.js tries to bundle this as a runtime export
```

#### Wrong Solution: Direct Business Service Imports

```typescript
// ❌ VIOLATION: Pages/components importing from business services
// app/admin/(protected)/clients/new/page.tsx
import type { CreateClientDto } from '@/lib/services/business/client.service'
// ARCHITECTURAL VIOLATION: App layer importing from business layer

// components/forms/client-form.tsx
import type { CreateClientDto } from '@/lib/services/business/client.service'
// ARCHITECTURAL VIOLATION: Components importing from business layer
```

**Why This Violates Architecture:**
- Pages and components are app/presentation layer
- Business services are business logic layer
- App layer should only communicate with business layer through defined contracts
- Direct imports create tight coupling and break layer separation

#### Correct Solution: Shared Types File

Create a dedicated types file that both layers can import from:

```typescript
// ✅ CORRECT: Create shared types file
// lib/types/client.ts
import type { Client as PrismaClient } from '@prisma/client'

/**
 * Serializable Client type for Client Components
 * Converts Prisma Decimal to number for Next.js serialization
 */
export type Client = Omit<PrismaClient, 'monthlyRetainer'> & {
  monthlyRetainer: number | null
}

export interface GetClientsParams {
  page?: number
  limit?: number
  search?: string
}

export interface CreateClientDto {
  companyName: string
  businessId?: string
  sector?: string
  serviceTier: 'TIER_1' | 'DOC_ONLY' | 'AD_HOC'
  monthlyRetainer?: number
  contactName: string
  contactEmail: string
  contactPhone?: string
  contractStartDate?: Date
  contractRenewalDate?: Date
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING'
}

export interface UpdateClientDto {
  companyName?: string
  businessId?: string
  sector?: string
  serviceTier?: 'TIER_1' | 'DOC_ONLY' | 'AD_HOC'
  monthlyRetainer?: number
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  contractStartDate?: Date
  contractRenewalDate?: Date
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING'
}

export interface ClientResponse {
  clients: PrismaClient[] // Internal use - returns Prisma clients with Decimal
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Serializable version for Client Components
export interface SerializableClientResponse {
  clients: Client[] // Serializable clients with number
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
```

#### Usage: Both Layers Import from Shared Types

```typescript
// ✅ Business service imports from shared types
// lib/services/business/client.service.ts
import type {
  GetClientsParams,
  CreateClientDto,
  UpdateClientDto,
  ClientResponse,
} from '@/lib/types/client'

export class ClientService {
  async getClients(params: GetClientsParams): Promise<ClientResponse> {
    // Implementation
  }
}

// ✅ Server Actions import from shared types
// app/admin/(protected)/clients/actions.ts
'use server'

import type { CreateClientDto, SerializableClientResponse } from '@/lib/types/client'

export const getClients = withAuth(
  async (session, params): Promise<SerializableClientResponse> => {
    // Implementation
  }
)

// ✅ Pages import from shared types
// app/admin/(protected)/clients/new/page.tsx
import type { CreateClientDto } from '@/lib/types/client'

export default function NewClientPage() {
  const handleSubmit = async (data: CreateClientDto) => {
    // Use data
  }
}

// ✅ Components import from shared types
// components/forms/client-form.tsx
import type { CreateClientDto } from '@/lib/types/client'

export function ClientForm({
  onSubmit
}: {
  onSubmit: (data: CreateClientDto) => Promise<void>
}) {
  // Implementation
}
```

#### When to Use Shared Types

- ✅ DTOs (Data Transfer Objects) used across layers
- ✅ API request/response shapes
- ✅ Query parameters interfaces
- ✅ Pagination structures
- ❌ Service implementation details (keep in service file)
- ❌ Internal business logic types (keep in business layer)

---

## 4. Prisma Decimal Serialization

### Critical Pattern: Serializing Prisma Decimal for Client Components

Prisma's `Decimal` type cannot be serialized when passing from Server Components to Client Components or returning from Server Actions.

#### The Problem

```typescript
// ❌ ERROR: Prisma Decimal cannot be serialized
// app/admin/(protected)/clients/page.tsx (Server Component)
export default async function ClientsPage() {
  const clients = await clientService.getClients() // Returns Prisma Decimal
  return <ClientList clients={clients} /> // ERROR: Can't serialize Decimal
}

// Error message:
// Only plain objects can be passed to Client Components from Server Components.
// Decimal objects are not supported.
```

#### The Solution

**Step 1**: Create serializable type with `number` instead of `Decimal`:

```typescript
// lib/types/client.ts
import type { Client as PrismaClient } from '@prisma/client'

// Serializable version for Client Components
export type Client = Omit<PrismaClient, 'monthlyRetainer'> & {
  monthlyRetainer: number | null // number instead of Decimal
}

export interface SerializableClientResponse {
  clients: Client[] // Uses serializable Client type
  pagination: { ... }
}
```

**Step 2**: Convert in Server Action before returning to client:

```typescript
// app/admin/(protected)/clients/actions.ts
'use server'

import { withAuth } from '@/lib/server-actions/with-auth'
import { clientService } from '@/lib/services/business/client.service'
import type { SerializableClientResponse } from '@/lib/types/client'

export const getClients = withAuth(
  async (session, params): Promise<SerializableClientResponse> => {
    const result = await clientService.getClients(params)

    // Convert Decimal to number for client serialization
    const clients = result.clients.map((client) => ({
      ...client,
      monthlyRetainer: client.monthlyRetainer
        ? Number(client.monthlyRetainer)
        : null,
    }))

    return {
      ...result,
      clients, // Now serializable
    }
  }
)
```

**Step 3**: Use serializable type in components:

```typescript
// components/clients/client-list.tsx
'use client'

import type { Client } from '@/lib/types/client' // Serializable version

export function ClientList({ clients }: { clients: Client[] }) {
  return (
    <div>
      {clients.map((client) => (
        <div key={client.id}>
          {/* monthlyRetainer is now number, not Decimal */}
          Monthly: £{client.monthlyRetainer?.toFixed(2)}
        </div>
      ))}
    </div>
  )
}
```

#### Key Points

- Business service can continue using Prisma's `Decimal` type internally
- Server Actions convert `Decimal` to `number` before returning
- Client Components receive fully serializable data
- Type safety maintained throughout the chain

---

## 5. Error System Architecture

### Dual Error System: App Errors vs System Errors

#### App Errors (Expected, Operational Errors)

```typescript
// lib/errors/base.ts
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: unknown
  public readonly isOperational = true

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    }
  }
}
```

#### Validation Errors

```typescript
// lib/errors/validation.ts
export interface FieldError {
  field: string
  message: string
  code?: string
}

export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    details?: FieldError[]
  ) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class FieldValidationError extends ValidationError {
  constructor(field: string, message: string, code?: string) {
    super('Validation failed', [{ field, message, code }])
    this.name = 'FieldValidationError'
  }
}
```

#### Not Found Errors

```typescript
// lib/errors/not-found.ts
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`
    super(message, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class ClientNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('Client', id)
    this.name = 'ClientNotFoundError'
  }
}
```

#### Authentication & Authorization Errors

```typescript
// lib/errors/authentication.ts
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Invalid email or password')
    this.name = 'InvalidCredentialsError'
  }
}

export class SessionExpiredError extends AuthenticationError {
  constructor() {
    super('Session has expired')
    this.name = 'SessionExpiredError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}
```

#### System Errors (Infrastructure Issues)

```typescript
// lib/errors/system.ts
export class SystemError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'SystemError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class DatabaseError extends SystemError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR')
    this.name = 'DatabaseError'
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(message: string = 'Failed to connect to database') {
    super(message)
    this.name = 'DatabaseConnectionError'
  }
}

export class ConfigurationError extends SystemError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR')
    this.name = 'ConfigurationError'
  }
}
```

#### Error Checking Utilities

```typescript
// lib/errors/index.ts
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational
  }
  return false
}
```

---

## 6. Service Layer Implementation

### Constructor Dependency Injection Pattern

```typescript
// lib/services/business/client.service.ts
import { PrismaClient, Client } from '@prisma/client'
import { getDatabaseInstance } from '@/lib/database'
import {
  ValidationError,
  FieldValidationError,
  ClientNotFoundError,
} from '@/lib/errors'
import type {
  GetClientsParams,
  CreateClientDto,
  UpdateClientDto,
  ClientResponse,
} from '@/lib/types/client'

/**
 * ClientService - Business logic for client management
 *
 * Key patterns:
 * - Constructor dependency injection for database access
 * - Proper error handling with app errors
 * - Input validation
 * - Database transactions where needed
 */
export class ClientService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Get clients with search and pagination
   */
  async getClients(params: GetClientsParams): Promise<ClientResponse> {
    const { page = 1, limit = 25, search = '' } = params

    // Validate pagination parameters
    if (page < 1) {
      throw new ValidationError('Page must be greater than 0')
    }
    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100')
    }

    const offset = (page - 1) * limit

    // Build search conditions
    const where = search
      ? {
          OR: [
            { companyName: { contains: search, mode: 'insensitive' as const } },
            { contactEmail: { contains: search, mode: 'insensitive' as const } },
            { contactName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // Use transaction for consistency - parallel queries
    const [clients, totalCount] = await this.db.$transaction([
      this.db.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.db.client.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      clients,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  }

  /**
   * Get a client by ID
   */
  async getClientById(id: string): Promise<Client> {
    const client = await this.db.client.findUnique({
      where: { id },
    })

    if (!client) {
      throw new ClientNotFoundError(id)
    }

    return client
  }

  /**
   * Create new client with validation
   */
  async createClient(data: CreateClientDto, adminId?: string): Promise<Client> {
    // Validate email format
    if (!this.isValidEmail(data.contactEmail)) {
      throw new FieldValidationError('contactEmail', 'Invalid email format')
    }

    // Check for duplicate email
    const existing = await this.db.client.findFirst({
      where: { contactEmail: data.contactEmail },
    })

    if (existing) {
      throw new ValidationError('Client with this email already exists')
    }

    // Create client
    const client = await this.db.client.create({
      data: {
        ...data,
        createdBy: adminId || 'system',
      },
    })

    return client
  }

  /**
   * Update existing client
   */
  async updateClient(
    id: string,
    data: UpdateClientDto,
    _adminId?: string
  ): Promise<Client> {
    // Verify client exists
    await this.getClientById(id)

    // Validate email if provided
    if (data.contactEmail && !this.isValidEmail(data.contactEmail)) {
      throw new FieldValidationError('contactEmail', 'Invalid email format')
    }

    // Check for duplicate email if changing
    if (data.contactEmail) {
      const existing = await this.db.client.findFirst({
        where: {
          contactEmail: data.contactEmail,
          NOT: { id },
        },
      })

      if (existing) {
        throw new ValidationError('Client with this email already exists')
      }
    }

    // Update client
    const client = await this.db.client.update({
      where: { id },
      data,
    })

    return client
  }

  /**
   * Soft delete client (set status to INACTIVE)
   */
  async deleteClient(id: string, _adminId?: string): Promise<Client> {
    // Verify client exists
    await this.getClientById(id)

    // Soft delete
    const client = await this.db.client.update({
      where: { id },
      data: { status: 'INACTIVE' },
    })

    return client
  }

  // Private helper methods
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
}

// Singleton export pattern
const db = getDatabaseInstance()
export const clientService = new ClientService(db)
```

---

## 7. Hybrid API Approach: Server Actions + API Routes

This project uses a hybrid approach combining Next.js Server Actions and traditional API routes. Each serves different purposes.

### When to Use Server Actions vs Direct Service Imports

**Critical Decision Tree:**

#### Server Components (Pages) - Direct Import ✅
```typescript
// app/admin/(protected)/clients/[id]/page.tsx
// Server Component - already runs on server
import { clientService } from '@/lib/services/business/client.service'

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // ✅ Direct service import - no Server Action needed
  // Server Components can directly call business services
  const client = await clientService.getClientById(id)

  return <div>{client.companyName}</div>
}
```

#### Client Components - Use Server Actions ✅
```typescript
// components/clients/client-form.tsx
'use client'

import { createClient } from '@/app/admin/(protected)/clients/actions'

export function ClientForm() {
  async function handleSubmit(data: FormData) {
    // ✅ Client Component must use Server Action
    // Cannot directly import clientService
    const result = await createClient(data)
  }
}
```

**The Rule:**
- **Server Components (pages)** → Direct import business services for reads ✅
- **Client Components** → Use Server Actions for all server operations ✅
- **Mutations (from anywhere)** → Always use Server Actions ✅

### When to Use Server Actions

**Use Server Actions for:**
- ✅ Form submissions from Client Components
- ✅ Mutations (create, update, delete) from anywhere
- ✅ When Client Components need server-side logic
- ✅ Actions that return serializable data to Client Components

```typescript
// app/admin/(protected)/clients/actions.ts
'use server'

import { withAuth } from '@/lib/server-actions/with-auth'
import { clientService } from '@/lib/services/business/client.service'
import type { CreateClientDto, SerializableClientResponse } from '@/lib/types/client'

/**
 * Get clients - Server Action
 * Called from Client Components that need data
 */
export const getClients = withAuth(
  async (session, params): Promise<SerializableClientResponse> => {
    const result = await clientService.getClients(params || { page: 1, limit: 25 })

    // Convert Decimal fields to number for client serialization
    const clients = result.clients.map((client) => ({
      ...client,
      monthlyRetainer: client.monthlyRetainer ? Number(client.monthlyRetainer) : null,
    }))

    return {
      ...result,
      clients,
    }
  }
)

/**
 * Create client - Server Action
 * Called from form submission
 */
export const createClient = withAuth(async (session, data: CreateClientDto) => {
  return await clientService.createClient(data, session.adminId)
})
```

**Server Action Authentication Pattern:**

```typescript
// lib/server-actions/with-auth.ts
import { validateSession } from '@/lib/utils/system/session'
import type { AdminSession } from '@/lib/types/auth'

export function withAuth<TArgs extends unknown[], TResult>(
  handler: (session: AdminSession, ...args: TArgs) => Promise<TResult>
) {
  return async (...args: TArgs): Promise<TResult> => {
    const session = await validateSession()

    if (!session) {
      throw new Error('Unauthorized: No valid session found')
    }

    return handler(session, ...args)
  }
}
```

### Server Action Error Handling Pattern

**Critical Pattern**: Next.js Server Actions don't properly serialize thrown errors to clients. Even when throwing `new Error(message)`, Next.js wraps it with a digest and returns a 500 error instead of passing the message through.

**❌ Wrong Approach (Throwing Errors):**

```typescript
// ❌ PROBLEM: Thrown errors don't serialize properly
export const createUser = withAuth(async (session, data: CreateAdminDto) => {
  try {
    const admin = await adminService.createAdmin(data)
    return admin
  } catch (error) {
    // Even converting AppError to Error doesn't work!
    if (isAppError(error)) {
      throw new Error(error.message)  // ❌ Gets wrapped with digest, returns 500
    }
    throw error
  }
})

// Component receives generic error, not user-friendly message
```

**✅ Correct Approach (Return Result Objects):**

```typescript
// ✅ SOLUTION: Define standard result type
export type ServerActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ✅ Server Action returns result object
export const createUser = withAuth(
  async (session, data: CreateAdminDto): Promise<ServerActionResult<Admin>> => {
    // Check permissions
    if (!canPerformAction(session, 'create_admin')) {
      return {
        success: false,
        error: 'Insufficient permissions. Only SUPER_ADMIN and ADMIN can create admin users.',
      }
    }

    try {
      const admin = await adminService.createAdmin(data)
      revalidatePath('/admin/users')

      return {
        success: true,
        data: admin,
      }
    } catch (error) {
      // Handle AppError instances (operational errors with user-friendly messages)
      if (isAppError(error)) {
        return {
          success: false,
          error: error.message, // ✅ User-friendly message passed through
        }
      }

      // Handle unexpected errors (don't leak implementation details)
      console.error('Unexpected error in createUser:', error)
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      }
    }
  }
)

// ✅ Component checks result instead of try-catch
async function onSubmit(data: CreateAdminFormValues) {
  setIsLoading(true)

  const result = await createUser({
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
  })

  setIsLoading(false)

  if (result.success) {
    toast.success('Admin user created successfully')
    router.refresh()
  } else {
    // ✅ Shows user-friendly error message
    toast.error('Failed to create admin user', {
      description: result.error,
    })
  }
}
```

**Key Points:**

- Server Actions should **return** error objects, not **throw** errors
- Components check `result.success` instead of using try-catch
- User-friendly error messages are preserved through serialization
- AppError messages are properly displayed to users
- Unexpected errors are logged but don't leak implementation details

### When to Use API Routes

**Use API Routes for:**
- ✅ External API consumers
- ✅ Webhook handlers
- ✅ Third-party integrations
- ✅ When you need full HTTP control (headers, status codes, streaming)

```typescript
// app/api/clients/route.ts
import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/withAuth'
import { withErrorHandling } from '@/lib/middleware/withErrorHandling'
import { withRequestLogging } from '@/lib/middleware/withRequestLogging'
import { clientService } from '@/lib/services/business/client.service'
import { ApiResponseBuilder, getRequestId } from '@/lib/utils/system/response'

/**
 * GET /api/clients - List clients
 * For external API consumers
 */
async function getClientsHandler(request: AuthenticatedRequest) {
  const requestId = getRequestId(request)
  const { searchParams } = new URL(request.url)

  const result = await clientService.getClients({
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 25,
    search: searchParams.get('search') || undefined,
  })

  return ApiResponseBuilder.paginated(
    result.clients,
    result.pagination,
    requestId
  )
}

/**
 * POST /api/clients - Create client
 * For external API consumers
 */
async function createClientHandler(request: AuthenticatedRequest) {
  const requestId = getRequestId(request)
  const body = await request.json()

  const client = await clientService.createClient(body)

  return ApiResponseBuilder.success(client, requestId, 201)
}

// Apply middleware: error handling -> logging -> auth
export const GET = withErrorHandling()(
  withRequestLogging()(
    withAuth(getClientsHandler)
  )
)

export const POST = withErrorHandling()(
  withRequestLogging()(
    withAuth(createClientHandler)
  )
)
```

### Key Differences

| Feature | Server Actions | API Routes |
|---------|---------------|------------|
| **Location** | `app/.../actions.ts` | `app/api/.../route.ts` |
| **Marker** | `'use server'` at top | Export HTTP methods |
| **Auth Pattern** | `withAuth` wrapper function | Middleware composition |
| **Return Type** | Must be serializable | NextResponse with full control |
| **Error Handling** | Try/catch + return errors | Middleware error boundaries |
| **Use Case** | UI-driven mutations | External APIs, webhooks |
| **Headers** | No direct control | Full header control |
| **Type Exports** | Cannot re-export types | Can export anything |

---

## 8. Middleware Composition

### Manual Middleware Composition

This project uses manual middleware composition rather than pre-composed stacks.

#### Available Middleware

```typescript
// lib/middleware/withAuth.ts
import { validateSession } from '@/lib/utils/system/session'
import type { AdminSession } from '@/lib/types/auth'

export interface AuthenticatedRequest extends Request {
  adminSession: AdminSession
}

export function withAuth<T = unknown>(
  handler: (request: AuthenticatedRequest, context: T) => Promise<Response>
) {
  return async (request: Request, context: T) => {
    const session = await validateSession()

    if (!session) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const authRequest = request as AuthenticatedRequest
    authRequest.adminSession = session

    return handler(authRequest, context)
  }
}
```

```typescript
// lib/middleware/withErrorHandling.ts
import { isAppError } from '@/lib/errors'

export function withErrorHandling<T = unknown>() {
  return (handler: (request: Request, context: T) => Promise<Response>) => {
    return async (request: Request, context: T) => {
      try {
        return await handler(request, context)
      } catch (error) {
        const requestId = crypto.randomUUID()

        // Handle App errors (expected, operational)
        if (isAppError(error)) {
          return Response.json(
            {
              success: false,
              error: {
                message: error.message,
                code: error.code,
                details: error.details,
              },
              requestId,
            },
            { status: error.statusCode }
          )
        }

        // Handle unexpected errors (don't leak details)
        console.error('Unexpected error:', error)
        return Response.json(
          {
            success: false,
            error: {
              message: 'An unexpected error occurred',
              code: 'INTERNAL_ERROR',
            },
            requestId,
          },
          { status: 500 }
        )
      }
    }
  }
}
```

```typescript
// lib/middleware/withRequestLogging.ts
export function withRequestLogging<T = unknown>() {
  return (handler: (request: Request, context: T) => Promise<Response>) => {
    return async (request: Request, context: T) => {
      const startTime = Date.now()
      const requestId = crypto.randomUUID()

      console.log(`[${requestId}] ${request.method} ${request.url}`)

      try {
        const response = await handler(request, context)
        const duration = Date.now() - startTime

        console.log(
          `[${requestId}] ${response.status} - ${duration}ms`
        )

        return response
      } catch (error) {
        const duration = Date.now() - startTime
        console.error(
          `[${requestId}] Error - ${duration}ms`,
          error
        )
        throw error
      }
    }
  }
}
```

#### Applying Middleware

```typescript
// app/api/clients/route.ts
import { withAuth } from '@/lib/middleware/withAuth'
import { withErrorHandling } from '@/lib/middleware/withErrorHandling'
import { withRequestLogging } from '@/lib/middleware/withRequestLogging'

async function handler(request: AuthenticatedRequest) {
  // Handler implementation
}

// Apply middleware layers manually (inside-out execution order)
// Order: error handling -> logging -> auth -> handler
export const GET = withErrorHandling()(
  withRequestLogging()(
    withAuth(handler)
  )
)
```

**Execution Order:**
1. Error handling (outermost)
2. Request logging
3. Authentication
4. Handler (innermost)

---

## 9. Authentication Patterns

### Two Authentication Approaches

#### 1. Edge Middleware (Fast Route Protection)

```typescript
// middleware.ts (at project root)
import { NextRequest, NextResponse } from 'next/server'

/**
 * Edge-compatible session validation
 * Only validates cookie structure, not database state
 */
async function validateSessionCookie(
  sessionCookie: string | undefined
): Promise<boolean> {
  if (!sessionCookie) return false

  // Basic validation: cookie should be a non-empty base64 string
  if (sessionCookie.length < 50) return false

  const base64Regex = /^[A-Za-z0-9+/]+=*$/
  if (!base64Regex.test(sessionCookie)) return false

  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip for static assets and public endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/auth/login')
  ) {
    return NextResponse.next()
  }

  // Protect admin routes
  const isProtectedRoute = pathname.startsWith('/admin') &&
                          !pathname.startsWith('/admin/login')

  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get('admin_session')?.value
    const isValidSession = await validateSessionCookie(sessionCookie)

    if (!isValidSession) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)

      // API routes get 401, pages get redirect
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
```

#### 2. Server-Side Session Validation

```typescript
// lib/utils/system/session.ts
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/utils/system/encryption'
import type { AdminSession } from '@/lib/types/auth'

export async function validateSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')?.value

  if (!sessionCookie) {
    return null
  }

  try {
    const sessionData = await decrypt(sessionCookie)

    // Validate session structure
    if (!sessionData.adminId || !sessionData.email) {
      return null
    }

    // Check expiration
    if (sessionData.expiresAt < Date.now()) {
      return null
    }

    return sessionData as AdminSession
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}
```

#### 3. Protected Layout Pattern

```typescript
// app/admin/(protected)/layout.tsx
import { validateSession } from '@/lib/utils/system/session'
import { redirect } from 'next/navigation'
import { ProtectedLayoutClient } from '@/components/layouts/protected-layout-client'

// Force dynamic rendering for authenticated content
export const dynamic = 'force-dynamic'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await validateSession()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <ProtectedLayoutClient user={session}>
      {children}
    </ProtectedLayoutClient>
  )
}
```

---

## 10. Next.js App Router Patterns

### Client/Server Component Separation

**Critical Pattern**: React context providers cannot be used directly in server components. Must separate client and server concerns.

#### The Problem

```typescript
// ❌ WRONG: Server layout trying to use client context
// app/admin/(protected)/layout.tsx
import { SidebarProvider } from '@/components/ui/sidebar'

export default async function Layout({ children }) {
  const session = await validateSession() // Server-side

  return (
    <SidebarProvider> {/* ERROR: Context provider in server component */}
      {children}
    </SidebarProvider>
  )
}
```

#### The Solution

**Step 1**: Create client-only layout wrapper

```typescript
// components/layouts/protected-layout-client.tsx
'use client'

import { SidebarProvider } from '@/components/ui/sidebar'

export function ProtectedLayoutClient({
  children,
  user
}: {
  children: React.ReactNode
  user: AdminSession
}) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
```

**Step 2**: Server layout uses client wrapper

```typescript
// app/admin/(protected)/layout.tsx
import { ProtectedLayoutClient } from '@/components/layouts/protected-layout-client'

export const dynamic = 'force-dynamic'

export default async function Layout({ children }) {
  const session = await validateSession() // Server-side

  if (!session) redirect('/admin/login')

  return (
    <ProtectedLayoutClient user={session}>
      {children}
    </ProtectedLayoutClient>
  )
}
```

### Server Component Data Fetching

```typescript
// app/admin/(protected)/page.tsx
import { Suspense } from 'react'
import { DashboardMetrics } from '@/components/dashboard/metrics'
import { RecentClients } from '@/components/dashboard/recent-clients'

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Page Title */}
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Metrics with Suspense for streaming */}
      <Suspense fallback={<MetricsSkeleton />}>
        <DashboardMetrics />
      </Suspense>

      {/* Recent Clients with Suspense */}
      <Suspense fallback={<RecentClientsSkeleton />}>
        <RecentClients />
      </Suspense>
    </div>
  )
}
```

### Static Generation Control

```typescript
// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

// Force static generation for public content
export const dynamic = 'force-static'

// Let Next.js decide (default)
// No export needed
```

### Error Boundary Pattern

```typescript
// app/admin/(protected)/clients/error.tsx
'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Page</h2>
        <p className="text-muted-foreground mb-4">
          We encountered an error while loading this page.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={() => reset()}>Try Again</Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/admin/dashboard'}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 11. API Response Standards

### Consistent Response Format

```typescript
// lib/utils/system/response.ts
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: unknown
  }
  requestId?: string
  timestamp: string
}

export interface PaginatedApiResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
  requestId?: string
  timestamp: string
}

export class ApiResponseBuilder {
  static success<T>(
    data: T,
    requestId?: string,
    status: number = 200
  ): Response {
    return Response.json(
      {
        success: true,
        data,
        requestId,
        timestamp: new Date().toISOString(),
      },
      { status }
    )
  }

  static error(
    message: string,
    code: string,
    details?: unknown,
    requestId?: string,
    status: number = 400
  ): Response {
    return Response.json(
      {
        success: false,
        error: {
          message,
          code,
          details,
        },
        requestId,
        timestamp: new Date().toISOString(),
      },
      { status }
    )
  }

  static paginated<T>(
    data: T[],
    pagination: {
      page: number
      limit: number
      totalCount: number
      totalPages: number
    },
    requestId?: string
  ): Response {
    return Response.json({
      success: true,
      data,
      pagination,
      requestId,
      timestamp: new Date().toISOString(),
    })
  }
}

export function getRequestId(request: Request): string {
  return crypto.randomUUID()
}
```

---

## 12. Common Violations and Solutions

### Violation 1: Components Importing from Business Services

```typescript
// ❌ PROBLEM: Component importing from business layer
// components/forms/client-form.tsx
import type { CreateClientDto } from '@/lib/services/business/client.service'

// ✅ SOLUTION: Import from shared types
import type { CreateClientDto } from '@/lib/types/client'
```

### Violation 2: Passing Prisma Decimal to Client Components

```typescript
// ❌ PROBLEM: Passing Decimal to Client Component
export default async function Page() {
  const clients = await clientService.getClients() // Has Decimal
  return <ClientList clients={clients} /> // ERROR
}

// ✅ SOLUTION: Convert in Server Action
export const getClients = withAuth(async (session, params) => {
  const result = await clientService.getClients(params)

  const clients = result.clients.map((client) => ({
    ...client,
    monthlyRetainer: client.monthlyRetainer
      ? Number(client.monthlyRetainer)
      : null,
  }))

  return { ...result, clients }
})
```

### Violation 3: Context Provider in Server Component

```typescript
// ❌ PROBLEM: Provider in server component
export default async function Layout({ children }) {
  return <SidebarProvider>{children}</SidebarProvider> // ERROR
}

// ✅ SOLUTION: Client wrapper component
// components/layouts/layout-client.tsx
'use client'
export function LayoutClient({ children }) {
  return <SidebarProvider>{children}</SidebarProvider>
}

// app/layout.tsx
export default async function Layout({ children }) {
  return <LayoutClient>{children}</LayoutClient>
}
```

### Violation 4: Re-exporting Types from Server Actions

```typescript
// ❌ PROBLEM: Re-exporting types from 'use server' file
'use server'
export type { CreateClientDto } from '@/lib/services/business/client.service'
// ERROR: Next.js treats this as runtime export

// ✅ SOLUTION: Use shared types file
// lib/types/client.ts - define types here
// Both server actions and components import from lib/types/client.ts
```

---

## Appendix A: File Organization

### Actual Directory Structure

```
/
├── app/                              # Next.js 15 App Router
│   ├── admin/
│   │   ├── (protected)/              # Protected admin routes
│   │   │   ├── layout.tsx           # Auth check + layout
│   │   │   ├── page.tsx             # Dashboard
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx         # Client list (Server Component)
│   │   │   │   ├── actions.ts       # Server Actions
│   │   │   │   └── new/
│   │   │   │       └── page.tsx     # New client form
│   │   │   └── ...
│   │   └── login/
│   │       └── page.tsx              # Login page
│   └── api/                          # API routes (external use)
│       ├── health/
│       │   └── route.ts             # Health check endpoint
│       └── clients/
│           ├── route.ts             # GET, POST /api/clients
│           └── [id]/
│               └── route.ts         # GET, PUT, DELETE /api/clients/:id
├── components/                       # React components
│   ├── ui/                          # shadcn/ui components
│   ├── forms/                       # Form components
│   │   └── client-form.tsx
│   ├── layouts/                     # Layout components
│   │   └── protected-layout-client.tsx
│   ├── clients/                     # Client-specific components
│   │   ├── client-list.tsx
│   │   └── client-page-wrapper.tsx
│   └── nav-main.tsx                 # Main navigation
├── lib/
│   ├── types/                       # Shared type definitions
│   │   ├── client.ts                # Client DTOs and types
│   │   ├── auth.ts                  # Auth types
│   │   └── index.ts
│   ├── services/business/           # Business logic services
│   │   ├── client.service.ts        # ClientService class
│   │   ├── dashboard.service.ts     # DashboardService class
│   │   └── index.ts
│   ├── server-actions/              # Server Action utilities
│   │   └── with-auth.ts            # Auth wrapper for Server Actions
│   ├── middleware/                  # API route middleware
│   │   ├── withAuth.ts             # Auth middleware
│   │   ├── withErrorHandling.ts    # Error handling middleware
│   │   ├── withRequestLogging.ts   # Logging middleware
│   │   └── withRateLimit.ts        # Rate limiting middleware
│   ├── errors/                      # Error classes
│   │   ├── base.ts                 # AppError base class
│   │   ├── system.ts               # SystemError classes
│   │   ├── validation.ts           # ValidationError classes
│   │   ├── not-found.ts            # NotFoundError classes
│   │   ├── authentication.ts       # Auth error classes
│   │   ├── conflict.ts             # ConflictError classes
│   │   └── index.ts                # Barrel export
│   ├── utils/system/                # System utilities
│   │   ├── session.ts              # Session validation
│   │   ├── response.ts             # API response builders
│   │   ├── encryption.ts           # Encryption utilities
│   │   └── database.ts             # Database utilities
│   ├── hooks/                       # React hooks
│   │   └── useOptimisticClient.ts  # Optimistic updates hook
│   └── database.ts                  # Prisma client singleton
├── middleware.ts                    # Edge middleware (route protection)
└── prisma/
    └── schema.prisma                # Prisma schema
```

---

## Appendix B: Implementation Templates

### Complete Service Template

```typescript
// lib/services/business/[entity].service.ts
import { PrismaClient } from '@prisma/client'
import { getDatabaseInstance } from '@/lib/database'
import {
  ValidationError,
  NotFoundError,
  ConflictError
} from '@/lib/errors'
import type {
  Get[Entity]Params,
  Create[Entity]Dto,
  Update[Entity]Dto,
  [Entity]Response,
} from '@/lib/types/[entity]'

export class [Entity]Service {
  constructor(private readonly db: PrismaClient) {}

  async getAll(params: Get[Entity]Params): Promise<[Entity]Response> {
    // Validation
    // Build where clause
    // Execute query with pagination
    // Return formatted response
  }

  async getById(id: string): Promise<[Entity]> {
    const entity = await this.db.[entity].findUnique({ where: { id } })
    if (!entity) throw new NotFoundError('[Entity]', id)
    return entity
  }

  async create(data: Create[Entity]Dto, userId: string): Promise<[Entity]> {
    // Validation
    // Duplicate check
    // Create entity
    return entity
  }

  async update(
    id: string,
    data: Update[Entity]Dto,
    userId: string
  ): Promise<[Entity]> {
    // Exists check
    // Validation
    // Update entity
    return entity
  }

  async delete(id: string, userId: string): Promise<void> {
    // Soft delete pattern
    await this.db.[entity].update({
      where: { id },
      data: { status: 'INACTIVE' }
    })
  }
}

const db = getDatabaseInstance()
export const [entity]Service = new [Entity]Service(db)
```

### Complete API Route Template

```typescript
// app/api/[entity]/route.ts
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/withAuth'
import { withErrorHandling } from '@/lib/middleware/withErrorHandling'
import { withRequestLogging } from '@/lib/middleware/withRequestLogging'
import { [entity]Service } from '@/lib/services/business/[entity].service'
import { ApiResponseBuilder, getRequestId } from '@/lib/utils/system/response'

async function getHandler(request: AuthenticatedRequest) {
  const requestId = getRequestId(request)
  const { searchParams } = new URL(request.url)

  const result = await [entity]Service.getAll({
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 25,
  })

  return ApiResponseBuilder.paginated(
    result.data,
    result.pagination,
    requestId
  )
}

async function postHandler(request: AuthenticatedRequest) {
  const requestId = getRequestId(request)
  const body = await request.json()

  const entity = await [entity]Service.create(
    body,
    request.adminSession.adminId
  )

  return ApiResponseBuilder.success(entity, requestId, 201)
}

export const GET = withErrorHandling()(
  withRequestLogging()(
    withAuth(getHandler)
  )
)

export const POST = withErrorHandling()(
  withRequestLogging()(
    withAuth(postHandler)
  )
)
```

### Complete Server Actions Template

```typescript
// app/admin/(protected)/[entity]/actions.ts
'use server'

import { withAuth } from '@/lib/server-actions/with-auth'
import { [entity]Service } from '@/lib/services/business/[entity].service'
import type {
  Create[Entity]Dto,
  Update[Entity]Dto,
  Serializable[Entity]Response,
} from '@/lib/types/[entity]'

export const get[Entity]s = withAuth(
  async (session, params): Promise<Serializable[Entity]Response> => {
    const result = await [entity]Service.getAll(params || { page: 1, limit: 25 })

    // Convert any Decimal fields to number for serialization
    const entities = result.entities.map((entity) => ({
      ...entity,
      // Convert Decimal fields here
    }))

    return {
      ...result,
      entities,
    }
  }
)

export const create[Entity] = withAuth(
  async (session, data: Create[Entity]Dto) => {
    return await [entity]Service.create(data, session.adminId)
  }
)

export const update[Entity] = withAuth(
  async (session, id: string, data: Update[Entity]Dto) => {
    return await [entity]Service.update(id, data, session.adminId)
  }
)

export const delete[Entity] = withAuth(
  async (session, id: string) => {
    await [entity]Service.delete(id, session.adminId)
    return { success: true }
  }
)
```

---

## Appendix C: Decision Trees

### When to Use Server Actions vs API Routes

```
Does this need to be called from external systems?
├─ Yes → Use API Route
└─ No → Continue
         │
         Do you need full HTTP control (headers, status codes)?
         ├─ Yes → Use API Route
         └─ No → Continue
                  │
                  Is this a webhook or third-party integration?
                  ├─ Yes → Use API Route
                  └─ No → Use Server Action
```

### When to Apply Which Middleware

```
Is this an API route?
├─ Yes → Continue
│        │
│        Does it need authentication?
│        ├─ Yes → Apply: withErrorHandling -> withRequestLogging -> withAuth
│        └─ No → Apply: withErrorHandling -> withRequestLogging
│
└─ No → Is this a Server Action?
         ├─ Yes → Use withAuth wrapper function
         └─ No → No middleware needed
```

### When to Create Shared Types

```
Do multiple layers need this type?
├─ No → Define in the layer that uses it
└─ Yes → Continue
          │
          Is it a DTO or API contract?
          ├─ Yes → Create in lib/types/
          └─ No → Continue
                   │
                   Is it business logic internal?
                   ├─ Yes → Keep in business service
                   └─ No → Create in lib/types/
```

---

## Summary

This architectural guide ensures:

1. **Clean Separation**: App, business, and shared concerns remain separate
2. **Type Safety**: Full TypeScript coverage with proper serialization
3. **Proper Dependencies**: Dependencies flow downward only
4. **Maintainable Code**: Changes in one layer don't break others
5. **Next.js 15 Patterns**: Proper use of Server Components and Server Actions
6. **Production Ready**: Error handling, validation, and logging built-in

**Remember**: These principles guide us toward maintainable, scalable code that leverages Next.js 15's full capabilities while maintaining clean architecture.

**Use this document** when implementing features, reviewing code, or onboarding new team members or AI agents to ensure consistency across the codebase.
