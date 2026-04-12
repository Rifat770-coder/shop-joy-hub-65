# Shop Joy Hub

Shop Joy Hub is a React + TypeScript e-commerce storefront and admin dashboard powered by Appwrite.

## Tech Stack

- Vite
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Appwrite (Auth, Database, Functions, Realtime)

## Prerequisites

- Node.js 18+
- npm 9+
- Appwrite project (Cloud or self-hosted)

## Getting Started

1. Install dependencies:

```sh
npm install
```

2. Create local environment file:

```sh
cp .env.example .env
```

3. Fill in `.env` with your Appwrite details.

4. Start the app:

```sh
npm run dev
```

## Environment Variables

Required variables are documented in `.env.example`:

- `VITE_APPWRITE_PROJECT_ID`
- `VITE_APPWRITE_ENDPOINT`
- `VITE_APPWRITE_DATABASE_ID`
- `VITE_ADMIN_EMAILS`

Never commit real environment values.

## Available Scripts

- `npm run dev` starts Vite dev server
- `npm run build` builds production bundle
- `npm run build:dev` builds with development mode
- `npm run preview` previews production build
- `npm run lint` runs ESLint

## Appwrite Setup

The project uses these collections:

- `profiles`
- `orders`
- `favorites`
- `reviews`
- `products`
- `coupons`
- `store_settings`
- `user_roles`

Use the setup scripts in `scripts/` to bootstrap project data.

1. Setup project resources:

```sh
cd scripts
npm install
node setup-appwrite.js
```

2. Seed sample products:

```sh
node seed-products.js
```

## Appwrite Functions

This app depends on these functions:

- `create-order`
- `validate-coupon`
- `send-order-confirmation`

Ensure functions are deployed before relying on checkout in production.

## Migration Notes

The Supabase to Appwrite migration guide is available in `APPWRITE_MIGRATION.md`.

## Deployment Checklist

1. Configure production environment variables.
2. Confirm Appwrite collection permissions are correct.
3. Deploy Appwrite functions.
4. Run `npm run build` and verify the preview locally.
