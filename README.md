# clasicar (migrado desde Replit MotorScraper)

Webapp fullstack de búsqueda y comparación de autos clásicos, originalmente alojada en Replit como `MotorScraper`. Esta versión está preparada para correr en Railway con deploy automático desde GitHub.

## Stack

- **Frontend**: React 18 + Vite + Tailwind + shadcn/ui (Radix), Wouter (routing), React Query
- **Backend**: Node 20 + Express + TypeScript (`tsx`/`esbuild`)
- **DB**: PostgreSQL (Neon serverless) vía Drizzle ORM
- **Auth**: Passport (local, Google, Apple, Twitter)
- **Scraping**: Puppeteer + Playwright + Browserless (delega browser remoto)
- **IA**: OpenAI

## Scripts

```bash
npm install
npm run dev      # dev server (vite + express en puerto 5000)
npm run build    # vite build + esbuild server → dist/
npm run start    # NODE_ENV=production node dist/index.js
npm run db:push  # aplica el schema de Drizzle a la DB
npm run check    # tsc --noEmit
```

## Variables de entorno requeridas

Crear un `.env` local (NO commitear, ya está ignorado) o setear en Railway → Variables:

| Variable | Requerida | Notas |
|---|---|---|
| `DATABASE_URL` | sí | Postgres connection string (Neon serverless). Formato `postgresql://...?sslmode=require` |
| `SESSION_SECRET` | sí | Secret para `express-session`. Generar con `openssl rand -base64 64` |
| `OPENAI_API_KEY` | sí (para features de IA) | Key de OpenAI |
| `BROWSERLESS_API_KEY` | sí (para scraping prod) | API key de browserless.io |
| `BROWSER_WS_ENDPOINT` | opcional | Override del WebSocket de Browserless si no se usa la URL por defecto |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | opcional | OAuth Google |
| `APPLE_CLIENT_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` / `APPLE_TEAM_ID` | opcional | OAuth Apple |
| `TWITTER_CONSUMER_KEY` / `TWITTER_CONSUMER_SECRET` | opcional | OAuth Twitter |
| `PORT` | inyectado por Railway | Local default: 5000 |
| `NODE_ENV` | recomendado: `production` en Railway | |

> Las variables opcionales de OAuth solo son necesarias si los usuarios usan ese método de login.

## Deploy en Railway

1. Conectar este repo de GitHub al proyecto de Railway.
2. Setear las variables de entorno listadas arriba en Settings → Variables.
3. Railway usa `nixpacks.toml` y `railway.json` incluidos en el repo; instala Node 20 y las libs del sistema necesarias para Chromium headless.
4. Health check / entry: `npm run start` → escucha en `process.env.PORT`.

## Cambios respecto al original (Replit)

- `server/index.ts`: el puerto ahora se lee de `process.env.PORT` (Railway lo inyecta dinámicamente). Fallback a 5000 para uso local.
- `.gitignore`: agregado `.env*`, `.cache`, `.vite`, `*.log`.
- Nuevo: `nixpacks.toml` con dependencias de Chromium para Puppeteer/Playwright.
- Nuevo: `railway.json` apuntando a Nixpacks como builder.
- Se conserva `.replit` y los plugins de Vite de Replit (`@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`) — el cartographer solo se carga si `REPL_ID` está presente, así que en Railway es no-op.

## Local

```bash
cp .env.example .env   # (crearlo si querés)
npm install
npm run db:push        # sincronizar schema
npm run dev
# abrir http://localhost:5000
```
