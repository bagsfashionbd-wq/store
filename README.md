# AquaStore - Streamlined Next.js 15 Monolith E-Commerce

Welcome to the **AquaStore** project, a lightweight, high-performance, and secure e-commerce application built specifically for selling aquariums and accessories. 

This README documents the project context, architectural decisions, completed work, steps to fix the Next.js resolution error, and future tasks to perform. This document acts as a handoff file so that you can transfer the project to another machine and resume with a new coding assistant from this exact point.

---

## 1. Project Context & Summary of Conversation

### Initial State
We started with a workspace containing the **BS-Commerce monorepo**, which was multi-tenant and composed of a NestJS API backend (`headless`), a Next.js storefront client (`storefront`), and separate storeadmin/superadmin panels. This stack was identified as too heavy, complex to maintain, and expensive to host for a single-store local aquarium shop.

### Core Business Requirements
1. **Catalog Size**: ~30 products (aquariums, filters, plants, accessories) with a few variation attributes (e.g. size in feet, capacity, colors).
2. **Bangladesh Payment & Courier Integrations**:
   - **bKash Tokenized Checkout**: Needs to support both full prepaid checkouts and Cash on Delivery (COD).
   - **Pathao Courier Aladdin API**: Automatic courier dispatching.
   - **Prepaid Delivery Fee Policy**: In the case of COD, buyers must pay the delivery charge (৳60 inside Dhaka, ৳120 outside Dhaka) upfront via bKash. The product price is collected by the courier on delivery.
3. **Priorities**: Maximum speed, clean UI, ease of checkout, secure admin management, and low hosting costs.

### Architectural Decisions
- **Next.js 15 (App Router) & React 19 Monolith**: We initialized a brand new standalone monolith under the `/aquarium-store` directory. Next.js App Router was chosen to optimize loading speeds (global CDNs) and ease development (API routes and page rendering in one folder).
- **Supabase Integration**:
  - We swapped the monorepo's incomplete MySQL/MongoDB stack with **Supabase (PostgreSQL)**.
  - Supabase handles **Database** (PostgreSQL with `JSONB` for product variations), **Authentication** (Admin & User login), and **Storage** (image buckets for product pictures) under a single free tier.
  - We configured **Row-Level Security (RLS)** to protect customer records and restrict catalog uploads to whitelisted admin accounts.
- **Salvaged Design**: We retained `packages/storefront` within the workspace as a visual reference and adapted its green, modern, clean UI styles to Next.js 15.

---

## 2. What We Have Built (Current Implementation)

We constructed the complete project skeleton and implemented all core logic files:

1. **System Configs**:
   - [`package.json`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/package.json): Outlines Next.js 15, React 19, Tailwind CSS, Supabase SSR, and Axios.
   - [`tailwind.config.js`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/tailwind.config.js): Custom color configurations (emerald plant themes) and page entry animations.
   - [`next.config.mjs`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/next.config.mjs): Added Supabase hostnames whitelist for Next.js Image components.
2. **Database SQL Script**:
   - [`supabase_schema.sql`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/supabase_schema.sql): Creates all SQL tables (`categories`, `products`, `orders`, `order_items`), sets up granular RLS security policies, inserts the **30 seed items**, and registers the trigger function `decrement_product_stock` to handle stock levels dynamically.
3. **Supabase Connections**:
   - Client and Server helpers inside [`utils/supabase/`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/utils/supabase/) using cookie-based handlers.
   - [`middleware.ts`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/middleware.ts): Root Next.js middleware refreshing user sessions and guarding the `/admin/*` routes.
4. **Storefront Frontend Pages**:
   - [`CartContext.tsx`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/context/CartContext.tsx): Context state provider that stores items, quantities, and selected variations in localStorage.
   - [`Navbar.tsx`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/components/Navbar.tsx) & [`CartDrawer.tsx`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/components/CartDrawer.tsx): Layout elements and sidebar shopping cart side-drawers.
   - [`page.tsx`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/app/page.tsx) & [`HomePageClient.tsx`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/components/HomePageClient.tsx): Landing page with responsive catalog filtering and search queries.
   - [Product Detail Page](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/app/product/%5Bslug%5D/page.tsx) & [Client Layout](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/components/ProductDetailClient.tsx): Showcase product pictures, sizes/attribute selectors, stock status, and add-to-cart inputs.
   - [Checkout Page](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/app/checkout/page.tsx): Address inputs, Pathao Courier dropdowns, dynamic shipping calculations (Dhaka vs Non-Dhaka), and payment selection toggles.
   - [Order Success](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/app/order/confirmation/page.tsx) & [Order Failed](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/app/order/failed/page.tsx) receipt templates.
5. **Secure Admin Dashboard**:
   - [Admin Login](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/app/login/page.tsx): Login screen restricted to admin whitelists.
   - [Admin Layout & Dashboard](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/app/admin/page.tsx) & [Client View](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/components/AdminDashboardClient.tsx): Visual sales analytics (total sales, revenue, shipping collections, COD collectibles) and orders log table.
   - [Products Inventory Manager](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/app/admin/products/page.tsx) & [Client Form](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/components/AdminProductsClient.tsx): Catalog management grids allowing to add or delete items, and configure variations lists as JSON.
6. **API Integration Routes**:
   - [`app/api/pathao/route.ts`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/app/api/pathao/route.ts): Handles token grants and fetches cities, zones, and areas from Pathao's servers.
   - [`app/api/bkash/route.ts`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/app/api/bkash/route.ts): Creates payment links (setting payment total depending on COD vs Full Prepayment selection), capture executes bKash payments, updates inventory stocks, and automatically requests consignment bookings inside Pathao Courier.
   - [`app/api/admin/dispatch/route.ts`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/app/api/admin/dispatch/route.ts): Allows manual dispatch overrides if automatic booking fails.

---

## 3. Resolving the Next.js Resolution Error

> [!WARNING]
> **Issue**: When running `npm run dev` before executing `npm install` inside `/aquarium-store`, the system looks up the parent folder directory and resolves `next` to the monorepo's parent `node_modules`. Because the parent uses **Next.js 12** (which does not support the `app/` directory), it throws:
> `Error: Couldn't find a pages directory. Please create one under the project root.`

### The Resolution Steps:
To fix this, you **must run `npm install` inside the `aquarium-store` directory** to download Next.js 15 dependencies locally before starting the server. Run the following:

```bash
# 1. Access the project directory
cd aquarium-store

# 2. Install all local dependencies (This downloads Next.js 15, React 19, Supabase, and Tailwind)
npm install

# 3. Start the Next.js 15 development server
npm run dev
```

---

## 4. What We Still Need to Do (Handoff Tasks for Next Agent)

When you resume with a coding assistant on your next machine, ask the agent to complete these final steps:

### Task 1: Connect Supabase API Keys
- Create a project on Supabase and copy the **API URL**, **Anon Key**, and **Service Role Key**.
- Open the SQL Editor in Supabase and run the query script inside [`supabase_schema.sql`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/supabase_schema.sql) to seed the database.
- Edit [`aquarium-store/.env.local`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/.env.local) and paste these keys.

### Task 2: Configure bKash & Pathao Sandbox Credentials
- Input sandbox credentials (App Key, App Secret, Client ID, Client Secret, Store ID) in [`aquarium-store/.env.local`](file:///d:/Work/BS-Commerce/v5/BS-Commerce/aquarium-store/.env.local).
- Make sure `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000` (locally) or your production domain.

### Task 3: Create Admin Account
- In the Supabase Auth panel, create an email login with `admin@example.com` (or any email containing `admin`).
- Go to `/login` to sign in and open the dashboard panel.

### Task 4: Sandbox Checkout Tests
- Add a custom variant (e.g. standard aquarium 2 Feet) to the cart.
- Proceed to checkout, select a city (e.g. Dhaka), zone, and area (confirming Pathao dropdowns load).
- Select **Cash on Delivery** and click checkout. Ensure you get redirected to bKash's sandbox page charging you only the delivery fee (e.g. ৳60).
- Confirm payment using bKash dummy credential values.
- Verify redirect to `/order/confirmation` containing a Pathao tracking consignment ID and a receipt breaking down the cash-to-collect.

### Task 5: Production Build and Vercel Deployment
- Run `npm run build` to verify compiling.
- Connect the Git repository to Vercel, set Root Directory to `aquarium-store`, paste environment keys, and publish.
