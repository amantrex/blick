SaaS starter for WhatsApp-first dues collection (schools/clinics)

Tech: Next.js App Router, Tailwind CSS, Prisma + PostgreSQL, NextAuth, Razorpay.

Getting started
1) Copy `.env.example` to `.env` and set values
2) Run migrations and generate client

```
npm run prisma:generate
npm run prisma:migrate --name init
```

3) Start dev server

```
npm run dev
```

Key folders
- `src/app/api/*`: REST endpoints (auth, contacts, templates, campaigns, payments, webhooks)
- `prisma/schema.prisma`: DB models (multi-tenant)
- `src/lib/*`: prisma client and providers

Security/Notes
- Protect `.env` and webhook secrets
- For WhatsApp provider, pick one: Gupshup, Twilio, or Meta WABA
- For production, set DB pool (Prisma Accelerate or connection pool)
# blick
