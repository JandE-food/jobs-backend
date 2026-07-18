# Recruitment App - UK Cloud

This repository contains the base setup for a recruitment website:

- `apps/web`: Next.js frontend
- `apps/api`: Fastify backend
- `docker-compose.yml`: local stack for web, api, PostgreSQL, and Redis
- `infra/postgres/init/001_base.sql`: starter schema and demo user seed

## Simple Plan

1. Create a Next.js frontend in `apps/web`
2. Create a Fastify backend in `apps/api`
3. Add a homepage with the text `Recruitment App - UK Cloud`
4. Add a backend `/health` endpoint that returns `OK`
5. Add Dockerfiles for both apps
6. Add Docker Compose for web, api, PostgreSQL, and Redis
7. Add subscription billing with Stripe and Paystack
8. Add GDPR export and deletion flows
9. Document how to run everything locally

## Day 7 and Day 8 Features

### Billing

- `POST /billing/create-checkout`
- `POST /webhooks/stripe`
- `POST /webhooks/paystack`
- `GET /billing/subscription`
- Next.js pages: `/pricing` and `/billing/active`

Rules implemented:

- UK and EU style countries default to Stripe
- African countries default to Paystack
- `free` activates directly in the database
- If payment keys are empty, the API creates an active mock subscription and returns a local success URL for flow testing

### Privacy

- `POST /privacy/request-deletion`
- `GET /privacy/export`
- `POST /admin/privacy/delete/:user_id`
- Next.js page: `/settings/privacy`
- Homepage cookie banner for a simple consent start point

### Database

The repository now seeds a demo recruiter user:

- User ID: `1`
- Email: `demo@ukcloud.local`

Tables:

- `users`
- `subscriptions`
- `deletion_requests`

## Run With Docker

From the repository root:

```bash
docker compose up --build
```

Services:

- Web app: [http://localhost:3000](http://localhost:3000)
- API health: [http://localhost:3001/health](http://localhost:3001/health)
- Pricing page: [http://localhost:3000/pricing](http://localhost:3000/pricing)
- Privacy page: [http://localhost:3000/settings/privacy](http://localhost:3000/settings/privacy)
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

To stop everything:

```bash
docker compose down
```

To stop and remove database volumes too:

```bash
docker compose down -v
```

## Run Without Docker

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend

```bash
cd apps/api
npm install
npm run dev
```

Open [http://localhost:3001/health](http://localhost:3001/health).

Set environment variables if you want live payment sessions instead of mock redirects:

```bash
APP_URL=http://localhost:3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/recruitment
ADMIN_TOKEN=dev-admin-token
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_SCALE=price_...
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_PLAN_CODE_GROWTH=PLN_...
PAYSTACK_PLAN_CODE_SCALE=PLN_...
DEMO_USER_ID=1
DEMO_USER_EMAIL=demo@ukcloud.local
```

## Test Day 7

1. Open `/pricing`
2. Enter a country such as `UK` for Stripe or `Nigeria` for Paystack
3. Click `Subscribe`
4. If you are using test keys, complete checkout with provider test credentials
5. Confirm the app lands on `/billing/active`
6. Confirm the subscription row exists or updates in PostgreSQL

## Test Day 8

1. Open `/settings/privacy`
2. Click `Request account deletion`
3. Click `Download my data`
4. Review the downloaded JSON export
5. Click `Run admin delete` to simulate the admin deletion endpoint for the demo user

## Data Deletion Behavior

When admin deletion runs for a user:

- `users.email` is anonymized to `deleted+{user_id}@example.invalid`
- `users.deleted_at` is set
- `subscriptions.status` becomes `canceled`
- `deletion_requests.status` becomes `completed`

What is kept:

- Internal user ID
- Role
- Created timestamps
- Subscription history fields that are not direct PII

What is not yet present in this repository:

- `profiles`
- `resumes`
- `applications`

Those tables are mentioned in the product roadmap, but they have not been created in the current codebase yet.

## Useful Commands

Frontend build:

```bash
cd apps/web
npm run build
```

Backend checks and tests:

```bash
cd apps/api
npm install
npm run check
npm test
```
