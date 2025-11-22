You are an expert backend architect and senior NestJS developer.

I want you to GENERATE a complete NestJS backend project for a "Family Tree / Genealogy" website for a big extended family (Vietnamese context, but keep code in English).

## 0. Tech stack & versions (stable)

Use **STABLE, WIDELY USED versions**, NOT experimental / next:

-   Runtime:
    -   Node.js 20 LTS
-   Backend:
    -   NestJS core: ^10.0.0
    -   TypeScript: ^5.4.0
-   ORM & DB:
    -   PostgreSQL: version 14 or 15
    -   TypeORM: ^0.3.20
    -   @nestjs/typeorm: ^10.0.0
-   Common Nest ecosystem:
    -   @nestjs/config: ^3.1.0
    -   @nestjs/jwt: ^10.2.0
    -   @nestjs/passport: ^10.0.0
    -   passport: ^0.7.0
    -   passport-jwt: ^4.0.1
    -   class-validator: ^0.14.0
    -   class-transformer: ^0.5.1
    -   @nestjs/swagger: ^7.3.0
    -   reflect-metadata: ^0.2.1
    -   rxjs: ^7.8.1

Important constraints:

-   Use ONLY stable, documented NestJS decorators and APIs (no experimental decorators).
-   Keep the code compatible with these versions; do not rely on features from NestJS v11+ or experimental releases.

Project requirements:

-   Use **NestJS** v10-style modular architecture (`src/modules/...`).
-   Language: **TypeScript**.
-   ORM: **TypeORM** with **PostgreSQL**.
-   Use `.env` config with `@nestjs/config`.
-   Use `class-validator` + `class-transformer` for DTO validation.
-   Include basic **Swagger / OpenAPI** docs.
-   Use **JWT auth** (access + refresh token).
-   Use **role-based authorization** with NestJS guards.
-   Add basic health check endpoint.

The output should include:

-   A clear folder structure.
-   Main modules with skeleton code, entities, DTOs, services, controllers.
-   Example implementation for core endpoints (not just empty files).

Assume this backend will be consumed by a Next.js frontend later.

---

## 1. Domain & roles

We are building a genealogy system for **one big family clan** (one họ tộc), not a multi-tenant SaaS (v1 can assume a single family tree).

### 1.1 User roles

Define roles as an enum: `GUEST`, `MEMBER`, `COLLABORATOR`, `ADMIN`.

-   **GUEST**:
    -   Not authenticated, browse public endpoints only (e.g. public family tree, basic profile data for members marked as public).
-   **MEMBER**:
    -   Authenticated family member.
    -   Can view more detailed data, edit **their own** profile.
-   **COLLABORATOR**:
    -   Power user trusted by admins.
    -   Can create/update most family member records, relationships, events, but cannot manage roles.
-   **ADMIN**:
    -   Full permissions.
    -   Manage users, invitations, roles, basic configuration.

---

## 2. Modules & responsibilities

Create at least the following NestJS modules:

1. **AuthModule**
2. **UserModule** (for login accounts)
3. **MemberModule** (for family members in the tree)
4. **FamilyTreeModule** (tree queries, relationships)
5. **MediaModule** (just metadata & URLs, actual storage handled elsewhere)
6. **AdminModule**
7. **HealthModule**

Describe and implement the basics of each.

---

## 3. Database design (TypeORM entities)

Use PostgreSQL + TypeORM. Design entities with relations.

### 3.1 User (login account)

`User` represents a login account, which is usually linked to a `Member` (but not mandatory for v1).

Fields:

-   `id` (uuid, primary)
-   `email` (unique, string)
-   `passwordHash` (string, bcrypt hashed)
-   `role` (enum: GUEST, MEMBER, COLLABORATOR, ADMIN)
-   `displayName` (string, optional)
-   `isActive` (boolean, default true)
-   `createdAt`, `updatedAt` (timestamps)
-   Relation: optional `member` (OneToOne to Member)

### 3.2 Member (family tree node)

`Member` is a person in the family tree.

Fields:

-   `id` (uuid, primary)
-   `slug` (string, unique, used to generate profile URL, e.g. "nguyen-van-a-1970")
-   `firstName` (string)
-   `middleName` (string, nullable)
-   `lastName` (string, nullable – in Vietnamese context, `lastName` can be family name / họ)
-   `fullName` (string, computed/stored for search convenience)
-   `gender` (enum: MALE, FEMALE, OTHER, UNKNOWN)
-   `dateOfBirth` (date, nullable)
-   `dateOfDeath` (date, nullable)
-   `isAlive` (boolean, default true, but should be consistent with dateOfDeath)
-   `bio` (text, nullable)
-   `notes` (text, nullable, internal-only)
-   `avatarUrl` (string, nullable)
-   `placeOfBirth` (string, nullable)
-   `placeOfDeath` (string, nullable)
-   `occupation` (string, nullable)
-   `generationIndex` (integer, nullable – generation order in tree, root patriarch = 1, etc.)
-   `visibility` (enum: PUBLIC, MEMBERS_ONLY, PRIVATE)
-   `createdAt`, `updatedAt`

Relationships:

-   `father` (ManyToOne self reference, nullable)
-   `mother` (ManyToOne self reference, nullable)
-   `children` (OneToMany self reference)
-   Spouses modeled via a separate `Marriage` entity.

### 3.3 Marriage / Spouse relation

Create an entity `Marriage` (or `SpouseLink`) to model spouse relationships.

Fields:

-   `id` (uuid)
-   `partner1` (ManyToOne Member)
-   `partner2` (ManyToOne Member)
-   `startDate` (date, nullable)
-   `endDate` (date, nullable)
-   `status` (enum: MARRIED, DIVORCED, SEPARATED, WIDOWED)
-   `notes` (text, nullable)

### 3.4 FamilyBranch

Entity `FamilyBranch`:

-   `id` (uuid)
-   `name` (string) – e.g. "Branch of Third Son"
-   `description` (text, nullable)
-   `rootMember` (ManyToOne Member) – the root of this branch
-   `createdAt`, `updatedAt`
-   Relation: `members` (OneToMany Members) – optional.

### 3.5 Media

We don’t store files, only metadata and URLs.

Entity `Media`:

-   `id` (uuid)
-   `member` (ManyToOne Member, nullable) – media associated with a member
-   `url` (string)
-   `type` (enum: IMAGE, DOCUMENT, VIDEO, OTHER)
-   `title` (string, nullable)
-   `description` (text, nullable)
-   `createdAt`, `updatedAt`

### 3.6 Invitation

Entity `Invitation`:

-   `id` (uuid)
-   `email` (string)
-   `role` (enum: MEMBER, COLLABORATOR)
-   `token` (string, unique)
-   `expiresAt` (timestamp)
-   `acceptedAt` (timestamp, nullable)
-   `createdBy` (ManyToOne User)
-   `createdAt`, `updatedAt`

---

## 4. Auth & Security

### 4.1 Auth features

Implement **JWT-based** authentication with:

-   `POST /auth/register`
    -   Create a new `User` with role MEMBER (by default).
    -   Optionally link to existing `Member` via an optional `memberId` in the body.
-   `POST /auth/login`
    -   Accept `email` + `password`.
    -   Return `accessToken`, `refreshToken`, and basic user profile.
-   `POST /auth/refresh`
    -   Accept refresh token, return new access token.
-   `POST /auth/logout`
    -   Optionally invalidate refresh tokens (model refresh tokens in DB or simple in-memory for demo).

Use:

-   Password hashing via bcrypt.
-   Guards:
    -   `JwtAuthGuard` for authenticated routes.
    -   `RolesGuard` for role-based access.

### 4.2 Role-based access policies (rough)

-   `ADMIN`:
    -   Full CRUD on users, members, tree, media, invitations.
-   `COLLABORATOR`:
    -   CRUD on members, marriages, tree, media.
    -   Cannot change user roles.
-   `MEMBER`:
    -   Can update their own User profile.
    -   Can update the Member linked to their User.
    -   Can view most members with visibility PUBLIC or MEMBERS_ONLY.
-   `GUEST`:
    -   Only view endpoints explicitly public.

Implement **at least**:

-   Decorator `@Roles(...)` + guard that checks `user.role`.

---

## 5. Member & FamilyTree API design

Base route: `/members`

Implement:

-   `GET /members`
    -   Query params: pagination (`page`, `limit`), filters (`q`, `branchId`, `generationIndex`, `isAlive`, `visibility`).
    -   Return paginated list with total count.
-   `GET /members/:id`
    -   Return member detail with relations: father, mother, spouses, children.
-   `POST /members`
    -   Restricted to `COLLABORATOR` or `ADMIN`.
-   `PATCH /members/:id`
    -   MEMBER can update themselves (if linked).
    -   COLLABORATOR/ADMIN can update any.
-   `DELETE /members/:id`
    -   ADMIN only (can implement soft delete).

Family tree endpoints, base: `/tree`

-   `GET /tree/root`
    -   Return root(s) of the family tree.
-   `GET /tree/member/:id`
    -   Return a subtree around that member with a structured JSON for frontend tree graph:
        -   Nodes: `{ id, name, gender, isAlive, avatarUrl, generationIndex }`
        -   Edges: parent-child + spouse relations.
-   `GET /tree/ancestors/:id?maxDepth=...`
-   `GET /tree/descendants/:id?maxDepth=...`

---

## 6. Admin & User management endpoints

Base routes: `/admin/users`, `/admin/invitations`.

Implement:

-   `GET /admin/users`
    -   ADMIN only.
    -   Pagination, filter by role, email, isActive.
-   `PATCH /admin/users/:id/role`
    -   ADMIN only.
-   `PATCH /admin/users/:id/status`
    -   Enable/disable user (`isActive`).
-   `POST /admin/invitations`
    -   ADMIN can create invitations (email, role).
-   `GET /admin/invitations`
    -   List invitations.
-   `POST /auth/accept-invitation`
    -   Accept invitation token, create User account.

---

## 7. Media endpoints

Base route: `/media`

-   `GET /media?memberId=...`
    -   List media for a specific member.
-   `POST /media`
    -   Create a media record:
        -   Body includes `memberId` (optional), `url`, `type`, `title`, `description`.
-   `DELETE /media/:id`
    -   COLLABORATOR or ADMIN.

---

## 8. Non-functional requirements & conventions

-   Use **DTOs** for all request/response with `class-validator` decorators.
-   Use a global `ValidationPipe`.
-   Use a global exception filter or Nest default, but structure errors cleanly.
-   Use `ConfigModule` + `ConfigService` for environment variables:
    -   `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`.
    -   `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN`.
-   Add a simple health check module:
    -   `GET /health` → returns `status: 'ok'` and maybe DB connection status.

---

## 9. Project skeleton & scripts

Provide at least:

-   Folder structure:
    -   `src/main.ts`
    -   `src/app.module.ts`
    -   `src/modules/auth/...`
    -   `src/modules/user/...`
    -   `src/modules/member/...`
    -   `src/modules/family-tree/...`
    -   `src/modules/media/...`
    -   `src/modules/admin/...`
    -   `src/modules/health/...`
    -   `src/common/guards/...`
    -   `src/common/decorators/...`
    -   `src/common/dto/...`
-   Example `package.json` scripts:
    -   `start`, `start:dev`, `build`, `lint`, `test` (optional).
-   Docker-friendly configuration:
    -   DB config read from env only (no localhost hardcoding).

---

## 10. Output expectation

Please generate:

-   Entity classes, DTOs, service & controller skeletons with **some core methods implemented** for the modules described.
-   Example usage of guards and roles.
-   Example of how tree endpoints would shape the response JSON for the frontend.

Code should be clean, idiomatic NestJS v10, and ready to extend.
