# RWA

RWA is a web app for selected Iranian stocks priced in USDT. Users can browse five funded symbols, sign in, and place buy/sell orders against live USDT conversion. The production site runs on a VPS with Express, Prisma, and SQLite.

Live site: https://rwastocks.online

## Stack

- React 19 + Vite + Tailwind
- Express (`server.ts`)
- Prisma + SQLite
- Live USDT/IRR from Nobitex
- Optional TSETMC last-price sync

## Run locally

Prerequisites: Node.js 20+

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

The app listens on the `PORT` from `.env` (defaults to 3000).

## Production notes

- Trading requires a fresh backend price (`marketUpdatedAt` within 5 minutes).
- TSETMC last-price sync is optional and never blocks page load. The VPS talks to `cdn.tsetmc.com` only through the Cloudflare Worker in `workers/tsetmc-proxy` (andro-cfw-style reverse proxy).
- Set `TSETMC_PROXY_BASE_URL` and `TSETMC_PROXY_SECRET` on the server, then `TSETMC_SYNC_ENABLED=true`.
- Even without TSETMC, USDT prices refresh from stored rial last prices plus the live Nobitex rate.
- Deposit/withdraw APIs are not enabled in this version.
