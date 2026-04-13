# Adamnak — Next.js + Convex + Vercel

Next.js 16 (App Router, TypeScript, Tailwind v4) alkalmazás [Convex](https://convex.dev)
háttérrel és [Vercel](https://vercel.com) deployment integrációval. A minta egy
valós idejű feladatlistát (tasks) tartalmaz.

## Gyors kezdés (lokális fejlesztés)

1. Függőségek telepítése:

   ```bash
   npm install
   ```

2. Convex projekt inicializálása (böngészőben belép a Convex-be, létrehoz egy
   deploymentet, beírja a `NEXT_PUBLIC_CONVEX_URL` értéket a `.env.local`-ba,
   és legenerálja a `convex/_generated` mappát):

   ```bash
   npx convex dev
   ```

   Tipp: a `npm run dev` parancs a `predev` scripten keresztül automatikusan
   elindítja a `convex dev --until-success` lépést, majd a Next.js dev szervert.

3. Alkalmazás indítása:

   ```bash
   npm run dev
   ```

   Böngésző: <http://localhost:3000>

## Projekt struktúra

```
app/
  layout.tsx                Root layout + ConvexClientProvider
  page.tsx                  Demó feladatlista (useQuery / useMutation)
  ConvexClientProvider.tsx  ConvexReactClient + ConvexProvider
convex/
  schema.ts                 tasks tábla definíciója
  tasks.ts                  list / add / toggle / remove query + mutation
  _generated/               (npx convex dev generálja, gitbe mehet)
vercel.json                 Vercel build command: convex deploy + next build
.env.local.example          NEXT_PUBLIC_CONVEX_URL sablon
```

## Vercel deployment

A projekt `vercel.json`-ja a Convex által ajánlott build parancsot használja:

```
npx convex deploy --cmd 'next build'
```

Lépések:

1. **Convex production deploy key**: <https://dashboard.convex.dev> →
   kiválasztott projekt → *Settings → Deploy Keys → Generate Production Deploy Key*.

2. **Projekt importálása Vercelre**: <https://vercel.com/new>. A Framework
   automatikusan *Next.js*-re vált. A `vercel.json` felülírja a build
   parancsot, egyéb beállítás nem kell.

3. **Environment változók** a Vercel projekt *Settings → Environment Variables*
   pontjában (Production + Preview):

   | Név                 | Érték                          |
   | ------------------- | ------------------------------ |
   | `CONVEX_DEPLOY_KEY` | az előbb generált deploy kulcs |

   A `NEXT_PUBLIC_CONVEX_URL`-t a `convex deploy --cmd` buildidőben
   automatikusan beállítja, nem kell manuálisan megadni.

4. **Deploy**. Minden push a fő ágra futtatja: `convex deploy` (séma + függvények
   push) → `next build` a frissen érkezett Convex URL-lel.

## Hasznos parancsok

| Parancs                | Mit csinál                                               |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Convex dev + Next.js dev szerver                         |
| `npm run build`        | Csak Next.js build (lokális sanity check)                |
| `npm run build:vercel` | Convex prod deploy + Next.js build (Vercel ezt futtatja) |
| `npx convex dashboard` | Megnyitja a Convex dashboardot                           |

## További olvasmány

- Convex + Next.js: <https://docs.convex.dev/quickstart/nextjs>
- Convex Vercel integráció: <https://docs.convex.dev/production/hosting/vercel>
