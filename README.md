# bazaar.in

An Amazon.in-style e-commerce MVP: customers browse, search, cart, and check out with a simulated payment flow; admins manage a product catalog, categories, and orders from a dedicated console.

## Stack

- **Next.js 16** (App Router, TypeScript, Server Actions) + **Tailwind CSS v4** + **shadcn/ui** (Base UI primitives)
- **Framer Motion** for animation (page transitions, product grid, cart drawer, admin dashboard counters, upload progress)
- **PostgreSQL** (native local install) + **Prisma 7** (via the `@prisma/adapter-pg` driver adapter, required by Prisma 7)
- **Auth.js v5** — credentials login, JWT sessions, role-based route protection (`src/proxy.ts`, Next.js 16's renamed `middleware`)
- Local filesystem image storage (`public/uploads/products`) behind an S3-shaped `saveProductImage(buffer)` function in `src/lib/storage.ts` — swap in an S3 client later without touching call sites
- **TanStack Query** for cart state (optimistic updates) + **Zustand** for cart drawer UI state
- **Zod** + **react-hook-form** for all forms
- Postgres full-text search via a generated `tsvector` column + GIN index (see `prisma/migrations/20260724175200_product_search_vector_generated`)
- In-memory rate limiting (`src/lib/rate-limit.ts`) on sign-in, sign-up, and checkout — see "Future Work" for the Redis upgrade path

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ running locally, with a database and user created (see below)

This project intentionally runs **without Docker** — Postgres is a native local install, and product images are stored on the local filesystem instead of S3/MinIO.

## First-time setup

1. Install dependencies:
   ```powershell
   npm install
   ```
2. Create the local Postgres role and database (adjust if you already have Postgres set up differently):
   ```powershell
   psql -U postgres -c "CREATE USER ecommerce WITH PASSWORD 'ecommerce_dev_pw' CREATEDB;"
   psql -U postgres -c "CREATE DATABASE ecommerce_dev OWNER ecommerce;"
   ```
3. Copy the env file and adjust if your DB credentials differ:
   ```powershell
   Copy-Item .env.example .env
   ```
4. Apply migrations and seed demo data:
   ```powershell
   npx prisma migrate deploy
   npx prisma db seed
   ```
5. Start the dev server:
   ```powershell
   npm run dev
   ```
6. Open http://localhost:3000

## Seeded accounts

| Role   | Email               | Password      |
| ------ | -------------------- | ------------- |
| Admin  | admin@bazaar.test    | Admin@12345   |
| User   | user@bazaar.test     | User@12345    |
| Seller | seller@bazaar.test   | Seller@12345  |

The seed also creates 6 categories (2 with subcategories), 18 platform products (including one out-of-stock item), a demo seller ("Nimbus Electronics") with 3 of their own products, a demo shipping address, one order in **every** order status for the demo user, and a few product reviews — enough to exercise pagination, low-stock warnings, and every admin/seller order-status view without placing new orders first.

## Sellers (marketplace)

Any signed-in customer can self-serve apply to become a seller at `/sell` (store name + URL slug + description, approved instantly — no admin review queue). Once approved they get their own console at `/seller`: a dashboard (revenue, orders, low stock), product management (identical create/edit/image-upload flow to the admin panel, scoped to their own listings), and an order view scoped to orders containing their products. Their products appear on the public storefront exactly like platform products, with a "Sold by {store}" link on the PDP to a public storefront page at `/sellers/{slug}`.

Known simplification: order status is still one value per whole order (not per seller/per item). If an order contains items from more than one seller, either seller can advance it forward, but only an admin can cancel/refund it (since that restocks every item in the order, not just theirs). The overwhelming majority of orders in this seed data and typical usage are single-seller, so this only matters for mixed carts.

## Smoke test

**As a customer:** browse the home page → filter/search products on `/products` → open a product page (gallery, price, reviews) → add to cart → checkout with a shipping address → complete the mock payment (≈90% success rate; a failure shows a retry) → view the order in `/account/orders`.

**As an admin:** sign in as `admin@bazaar.test` → `/admin` dashboard (revenue, order-status chart, low stock) → create a product with drag-and-drop image upload → edit an existing product → manage categories (create a subcategory, verify delete is blocked while it has products) → open an order and advance its status.

## Project structure

```
prisma/schema.prisma       Data model (User, Category, Product, Order, Payment, Review, ...)
prisma/seed.ts             Seed script — 2 users, categories, products, demo orders, reviews
src/app/(storefront)/      Public storefront: home, products, PDP, cart, checkout, account
src/app/(auth)/            Sign in / sign up
src/app/(admin)/admin/     Admin console: dashboard, products, categories, orders
src/app/api/               NextAuth route, admin image upload, health check
src/server/actions/        Server Actions (mutations) — cart, checkout, product, category, order
src/server/queries/        Read-only query functions used by Server Components
src/components/            ui/ (shadcn), storefront/, admin/, auth/, shared/
src/lib/                   db, auth, storage, rate-limit, mock-payment, order-number, utils
src/validation/            Zod schemas shared by client forms and server actions
```

## Notes on the mock payment flow

Checkout creates an `Order` + `Payment` (status `PENDING`) and decrements stock immediately (reserving inventory). The payment step (`/checkout/payment/[orderId]`) simulates a gateway: a 1.5–3.5s delay, then a weighted-random outcome (90% success). On failure, reserved stock is released back and the order is marked `CANCELLED`; the customer can retry. Cash on Delivery always succeeds immediately. This is intentionally simple — see "Future Work" for a real gateway integration.

## Future work

Deliberately out of scope for this MVP, called out so scope stays locked:

- Real payment gateway (Razorpay/Stripe) in place of the mock flow
- Redis-backed rate limiting and checkout idempotency locks (currently in-memory, fine for a single dev instance)
- Meilisearch/Typesense/Elasticsearch if the catalog outgrows Postgres full-text search
- Multi-vendor marketplace (multiple sellers each managing their own catalog)
- Email notifications (order confirmation, shipping updates)
- Wishlist, coupons/discounts, saved payment methods
- S3 (or compatible) object storage in place of local-disk image storage — `src/lib/storage.ts` is already shaped for a drop-in swap
