# SMMDOC

**Your Social Media Growth Partner** - an SMM (Social Media Marketing) panel for buying and managing social media services (likes, followers, views, etc.) across multiple platforms.

---

## Overview

SMMDOC is a full‑stack SMM panel that lets users order social media services, manage funds, use an API, run child panels, and participate in an affiliate program. Admins can manage orders, services, users, providers, payments, and site settings. The app supports user and admin dashboards, support tickets, announcements, blogs, and configurable payment gateways.

---

## Project Stack

| Layer | Technologies |
|-------|--------------|
| **Framework** | Next.js 16 (App Router), React 19 |
| **Language** | TypeScript 5.8 |
| **Database** | PostgreSQL, Prisma ORM |
| **Auth** | NextAuth.js (credentials, OAuth) |
| **UI** | Tailwind CSS, Radix UI, Framer Motion, Lucide / React Icons |
| **State** | Redux Toolkit, SWR |
| **Forms & Validation** | React Hook Form, Zod |
| **Email** | Nodemailer |
| **Testing** | Vitest, Testing Library, Playwright |

---

## Features

### User

- **Dashboard** — overview and stats  
- **Orders** — New order, Mass orders, My orders  
- **Services** — All services, Favorites, Service updates  
- **Funds** — Add funds, Transfer funds, Transactions  
- **Support** — Support tickets, Tickets history, Contact support  
- **API** — API integration for automation  
- **Child Panel** — Reseller / sub-panels  
- **Affiliate** — Affiliate program, Withdrawals  
- **Help** — FAQs, Terms  
- **Account** — Account settings  

### Admin

- **Dashboard** — admin overview and metrics  
- **Orders** — All orders, Refill requests, Cancel requests  
- **Services** — All services, Import, Bulk modify, Update price, API sync logs  
- **Users** — Users, Admins, Moderators, User activity logs  
- **Transactions** — All transactions  
- **Support** — Support tickets, Contact messages (Human ticket)  
- **Content** — Blogs, Announcements  
- **Affiliates** — Affiliate users, Withdrawals  
- **Analytics** — Analytics & reports  
- **Child Panels** — Child panel management  
- **Settings** — General, Appearance, Providers, Payment gateway, Payment currency, Notifications, Email, Integrations, Custom codes  

---

## Getting Started

### Prerequisites

- **Node.js** 18+  
- **npm**  
- **PostgreSQL** (for `DATABASE_URL`)  

### 1. Clone and install

```bash
git clone <repo-url>
cd smmdoc
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your values. At minimum:

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Use `NEXT_PUBLIC_API_URL` if your API base URL differs. Other vars (e.g. `ADMIN_EMAIL`, payment, email, reCAPTCHA) are optional but needed for those features.

### 3. Database setup

```bash
npx prisma generate
npx prisma migrate deploy
```

Optional seed:

```bash
npm run db:seed
```

### 4. Create the first admin

**Requirement:** There must be **no existing admin** in the database. If any admin exists, the script exits and does not create another.

Run the following before creating the admin:

```bash
npx prisma generate
npx prisma db push
npm run create-admin
```

This creates an admin with:

- **Username:** `smmdoc_admin`  
- **Password:** `suitableit`  
- **Name:** `SMMDOC Admin`  
- **Email:** `admin@smmdoc.com`  

Change the password after first login. If you see *"Failed to create admin because some or 1 admin is already exist."*, an admin already exists; use that account or manage admins from the admin panel.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use the admin credentials above to sign in at the admin sign‑in page.

### Other commands

```bash
npm run build     # Production build
npm run start     # Production server
npm run lint      # Lint
npm run test      # Run tests
```

---

## Provider Order Sync (Automatic)

Provider order sync runs **automatically every 5 minutes** using `node-cron` inside the Next.js process. No shell script or system crontab is required.

When you start the app (`npm run dev` or `npm run start`), the sync job is scheduled. It runs as long as the app is running.

---

## Conclusions

SMMDOC is a feature‑rich SMM panel with separate user and admin experiences, API and child‑panel support, and configurable payments and notifications. The stack (Next.js, Prisma, NextAuth, Tailwind) is chosen for maintainability and scalability. Use the create‑admin script only when no admin exists; afterward, manage users and roles from the admin panel.
