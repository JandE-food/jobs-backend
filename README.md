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
7. Add subscription billing with Stripe, Paystack, and Flutterwave
8. Add GDPR export and deletion flows
9. Add real backend auth plus recruiter/company workflows
10. Document how to run everything locally

## Day 7 and Day 8 Features

### Billing

- `POST /billing/create-checkout`
- `POST /webhooks/stripe`
- `POST /webhooks/paystack`
- `POST /webhooks/flutterwave`
- `GET /billing/subscription`
- Next.js pages: `/pricing` and `/billing/active`

Rules implemented:

- UK and EU style countries default to Stripe
- African countries default to Flutterwave
- Paystack remains available as an explicit backend provider override for future regional rollout
- `free` activates directly in the database
- If payment keys are empty, the API creates an active mock subscription and returns a local success URL for flow testing

### Privacy

- `POST /privacy/request-deletion`
- `GET /privacy/export`
- `POST /admin/privacy/delete/:user_id`
- Next.js page: `/settings/privacy`
- Homepage cookie banner for a simple consent start point

### Auth and Recruiter Workflows

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/admin-token`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /recruiter/dashboard`
- `GET /recruiter/candidates`
- `GET /recruiter/shortlists`
- `POST /recruiter/shortlists`
- `POST /recruiter/shortlists/:id/items`
- `DELETE /recruiter/shortlists/:id/items/:candidateId`
- `GET /companies`
- `GET /companies/:slug`
- `POST /companies`
- `GET /jobs`
- `POST /jobs`
- Next.js routes: `/recruiter`, `/recruiter/candidates`, `/recruiter/shortlists`, `/recruiter/companies`, `/companies`, `/companies/[slug]`

### Database

The repository now seeds a demo recruiter user:

- User ID: `1`
- Email: `demo@ukcloud.local`

Admin bearer token generation uses the existing `AUTH_TOKEN_SECRET` and the
`POST /auth/admin-token` route. It expects an existing `users` row with
`role = 'admin'`, plus that user's email and password. Use the returned bearer
token in `Authorization: Bearer <token>` for admin-only routes.

Tables:

- `users`
- `profiles`
- `companies`
- `jobs`
- `shortlists`
- `shortlist_items`
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

## Production Deployment

This repository includes a production stack for one HTTPS domain serving both the
web app and the backend API:

- Web app: `https://your-domain`
- API: `https://your-domain/api`

Files included for production deployment:

- `docker-compose.prod.yml`
- `.env.production.example`
- `infra/caddy/Caddyfile`
- `apps/web-new/.env.production.example`
- `apps/mobile/.env.example`

### Deploy To OVH

1. Point your domain DNS `A` record to the OVH server IP.
2. Copy this repository to the server.
3. Copy `.env.production.example` to `.env.production` and fill in real values.
4. Start the production stack from the repository root:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

5. Confirm the services are live:

```bash
curl https://your-domain/api/health
```

The Caddy reverse proxy automatically provisions HTTPS certificates once the
domain resolves to the server and ports `80` and `443` are reachable.

### Web App Production Environment

Set:

```bash
NEXT_PUBLIC_API_URL=https://your-domain/api
```

### Mobile App And APK Environment

Set:

```bash
EXPO_PUBLIC_API_URL=https://your-domain/api
```

Use the hosted HTTPS API URL for APK builds. Do not leave the mobile app pointed
at `localhost`, `127.0.0.1`, or `10.0.2.2`, because those only work for local
development and emulators.

## Run Without Docker

### Frontend

```bash
cd apps/web-new
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
AUTH_TOKEN_SECRET=replace-with-a-long-random-secret
AUTH_TOKEN_TTL_SECONDS=604800
ADMIN_TOKEN=dev-admin-token
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_SCALE=price_...
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_PLAN_CODE_GROWTH=PLN_...
PAYSTACK_PLAN_CODE_SCALE=PLN_...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_...
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST...
FLUTTERWAVE_WEBHOOK_HASH=your_dashboard_hash
DEMO_USER_ID=1
DEMO_USER_EMAIL=demo@ukcloud.local
DEMO_USER_PASSWORD=Password123!
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For the current deployment stage, keep using the OVH-hosted API and database. When you are ready to move the production control plane to Civo UK later, these same environment variables can be migrated there without changing the frontend flow.

## Test Day 7

1. Open `/pricing`
2. Enter a country such as `UK` for Stripe or `Nigeria` for Flutterwave
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

What is not yet fully built in this repository:

- resume file ingestion linked to persistent user records
- application tracking pipelines
- enterprise campaign automation beyond the first dashboard/ad hub surface

The current codebase now includes the first real auth, recruiter, company, job, shortlist, and directory layers, but it is still an early platform foundation rather than the full end-state product.

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

## OVH PM2

- Use the sample PM2 config in `infra/pm2/recruitment-api.ecosystem.cjs`
- Replace placeholder secrets before copying it to OVH
- Set Flutterwave webhook URL to `http://YOUR_OVH_IP:3001/webhooks/flutterwave`
- Restart PM2 after deployment so the schema initializer can add the new auth and recruiter tables

## Security Note

- Do not commit live payment secrets to the repository
- Keep Stripe, Paystack, and Flutterwave credentials in OVH environment variables or PM2 ecosystem env blocks
- Only the backend should hold `*_SECRET_KEY`, `*_ENCRYPTION_KEY`, or webhook verification values
