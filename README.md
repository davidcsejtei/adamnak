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

## Claude Code subagentek

A projekt `.claude/agents/` mappájában három specializált subagent él. Mindegyik
szigorú "mikor mondjon nemet" szabályokkal dolgozik — inkább megállnak és
kérdeznek, mint hogy rosszat csináljanak.

### `iteration-brancher` — branch életciklus

**Mikor fusson:** bármely új feladat / feature / kísérlet kezdetén, és akkor,
amikor egy iterációt preview-ra kell küldeni. Két módban dolgozik:

- **A mód — új iteráció indítása.** Trigger: "új iteráció", "új feature",
  "kezdjünk újat", "new branch", stb. Lépések:
  1. `git status` — ha `main`-en piszkos a fa, leáll és kérdez (stash / discard /
     rescue branch / abort).
  2. `git checkout main && git pull --ff-only origin main`. Ha a ff-only pull
     elbukik, megáll — nem rebase-el, nem force-ol.
  3. Bekéri a feladat rövid leírását, slugifyeli (ékezetek le, kisbetű, `-`),
     és `iter/YYYYMMDD-<slug>` névre hoz létre új branchet.
  4. `git checkout -b ...` — **push nélkül**. A branch csak lokálisan létezik.

- **B mód — preview-ra küldés.** Trigger: "mehet a preview-ra", "tolhatod",
  "ship to preview". Lépések:
  1. Ellenőrzi, hogy nem `main`-en vagy.
  2. `git status` + `git diff --stat`; secret-gyanús fájlokat (`.env*`,
     `*.pem`, `*credentials*`) külön megerősít.
  3. Név szerint stagelget (alapból nem `git add -A`), majd rákérdez, ha a teljes
     fát kell committolni.
  4. Commit üzenetet javasol (≤70 kar. subject, magyar ha a beszélgetés magyar),
     a felhasználó jóváhagyása után committol. Pre-commit hook bukás esetén
     **új commitot** csinál — sosem `--amend`, `--no-verify`.
  5. `git push -u origin HEAD` — ez indítja el a Vercel Preview buildet +
     a hozzá tartozó Convex preview deploymentet.

**Refuzál, ha:** piszkos `main`, ff-only pull bukik, `main`-en próbálnál
pusholni, secret-fájl készül committolódni, branch-név ütközik.

### `vercel-deployer` — frontend prod deploy Vercelre

**Mikor fusson:** amikor a Next.js appot élesre (Production) akarod küldeni
Vercelen — vagy egy validált preview-t promótálni prodba.

**Fontos csapda:** a `vercel.json` build parancsa `npx convex deploy --cmd 'next build'`,
vagyis egy Vercel prod deploy **egyszerre Convex prodba is pushol**. Ha vannak
függőben lévő schema változások, az agent megáll és a `release-manager`-höz
irányít.

Lépések:
1. **Pre-flight.** `git status` tiszta-e, `git log origin/main..HEAD` mit
   szállítanánk, `convex/schema.ts` diff a legutóbbi release óta.
2. **Lokális validáció** (megállás az első hibán): `npx tsc --noEmit` →
   `npm run lint` → `npm run build`.
3. **Env sanity check.** `.vercel/project.json` létezik-e (ha nem:
   `vercel link`). `vercel env ls production` — kötelező minimum:
   `NEXT_PUBLIC_CONVEX_URL` (prod URL!), `CONVEX_DEPLOY_KEY`, minden kódban
   használt `NEXT_PUBLIC_*`.
4. **Preview először.** `vercel` (--prod nélkül) → preview URL → a
   felhasználó smoke-teszteli → ACK.
5. **Production.** Csak ACK után: `vercel --prod`. Build logban figyeli a
   beágyazott `convex deploy` lépést. Ha Convex elutasítja a schema push-t,
   szó szerint jelenti a hibát — **nem** ad semmilyen "silence" flaget.
6. **Post-flight.** Prod URL GET, Convex adat renderel-e, majd jelentés:
   deployment ID, prod URL, preview URL, commit SHA, verzió, build időtartam.

**Refuzál, ha:** piszkos fa, bukott tsc/lint/build, függő schema változás
(→ `release-manager`), hiányzó prod env var, "skippeljük a preview-t"
kérés, `--force` / biztonsági flag kikapcsolás.

### `release-manager` — Convex production release (adatvédelemmel)

**Mikor fusson:** Convex production deployment — különösen ha a
`convex/schema.ts` változott. Az agent egyetlen célja: **élő adat elvesztése
nélkül** kiadni egy verziót. Schema-változás esetén migrációt és backfill-t
követel, és mielőtt bármihez nyúlna, rákérdez a létező sorok populálására.

Lépések:
1. **Pre-flight.** `git log origin/main..HEAD`, `convex/schema.ts` diff a
   legutóbbi release tag óta. Minden változás felsorolva: új tábla, új mező
   (opt / required), eltávolított mező, átnevezés, típusváltás, index mozgás.
2. **Kockázati besorolás.**
   - *Additív, opcionális*: biztonságos, de a felhasználótól megkérdezi, kell-e
     backfill.
   - *Additív, required*: csak migráció után engedheti a schemának required-re
     váltani.
   - *Eltávolítás / átnevezés*: kötelező kétfázisú migráció (writes both →
     backfill → drop).
   - *Típusváltás*: olvas-régi-ír-új migráció, átmeneti dual validátor.
3. **Backfill kérdezés.** Minden új/változó mezőre `AskUserQuestion`-nel: "Mi
   legyen a létező sorok értéke? (a) hagyjuk opcionálisnak, (b) konstans default
   (mi legyen?), (c) másik mezőből számolva (mi a logika?), (d) egyéb." Nincs
   továbbhaladás válasz nélkül.
4. **Migrációk & seederek.**
   - `convex/migrations/` — minden migráció `internalMutation`, **idempotens**,
     **lapozott** (sose húz be egy egész táblát memóriába), támogatja a
     dry-run / count-only módot.
   - `convex/seeders/` — prod seeder csak kiegészíthet, sose ír felül (`if
     (existing) return;`).
5. **Backup.** Destruktív migráció előtt: `npx convex export --prod --path
   ./backups/<timestamp>/`. Nem üres fájl → indulhat.
6. **Deploy.** `npx convex deploy --prod`. Schema validation errort szó szerint
   jelent — **nem** használ `--typecheck-components=false` flaget. Schema push
   után dry-run migráció → user review → élesben futtatás → végül seederek (ha
   kellenek).
7. **Post-flight.** Spot-check mintasorok a migrált táblákból, row count
   összehasonlítás (in-place migrationnél egyezniük kell), végül összegző
   jelentés: verzió, schema változások, row countok, backup útvonal, follow-upok.

**Refuzál, ha:** "csak most az egyszer skippeljük a migrációt", required mezőt
kér backfill terv nélkül, nem tud backupot készíteni, a schema fájl nem
committolt, a felhasználó nem tud válaszolni a backfill kérdésre.

### Tipikus iterációs körfolyamat

```
Te: "új feature, task szűrés státusz szerint"
  → iteration-brancher (A mód) — iter/YYYYMMDD-task-szures létrehozva lokálban

[fejlesztés, több commit vagy még egy sem — mindegy, lokális]

Te: "mehet a preview-ra"
  → iteration-brancher (B mód) — commit + push → Vercel Preview indul

[preview URL-en teszt]

Te: "mehet élesre"
  → vercel-deployer (ha csak frontend változott)
  → release-manager (ha schema / Convex változott — ők hívják egymást)
```

## Ha LLM nélkül akarsz deployolni preview-ra vagy prodra

Az alábbi a subagentek által csinált lépések manuális megfelelője — pont
ugyanazokat a parancsokat futtatod, csak te vezényled.

### Egyszeri setup (gépenként egyszer)

```bash
npm install -g vercel        # ha még nincs CLI
vercel login                 # böngészős OAuth
vercel link                  # a repó hozzárendelése a Vercel projekthez
```

A Convex CLI a `npx convex …` formában fut, külön telepítés nem kell.

### Preview deploy (feature branch → Vercel Preview)

A Vercel Git integráció minden pushra automatikusan buildet csinál a branchről,
és a build a `vercel.json` szerint a Convexbe is push-ol egy preview deploymentet.

```bash
git checkout -b iter/YYYYMMDD-<rovid-leiras>   # új ág main-ről
# … fejlesztés, commitok …
git push -u origin HEAD                         # ez indítja el a Preview buildet
```

Ezután a build URL-jét a Vercel dashboardban (vagy az adott branch GitHub PR-jában)
találod. Ha közvetlenül akarod a preview URL-t, futtathatod kézzel is:

```bash
vercel                       # preview deploy a jelenlegi munkaállapotból
```

### Production deploy

A pipe-line három lépés: **(1) Convex prod push → (2) szükséges seederek/migrációk
→ (3) Vercel prod build**. Ha schema változott, a sorrend kötelező — előbb a Convex,
hogy a frontend már a friss API-t kapja.

1. **Lokális validáció** (a Vercel build is leáll, ha bármi bukik):

   ```bash
   npx tsc --noEmit
   npm run lint
   npm run build
   ```

2. **Convex prod deploy** — séma + függvények:

   ```bash
   npx convex deploy --prod
   ```

   Schema validation hiba esetén **ne** add hozzá a `--typecheck-components=false`
   vagy hasonló silence flageket — javítsd a sémát / migrációt.

3. **Migráció / seeder, ha szükséges**. Példa erre a repóra (üres prod tábla
   felseedelése):

   ```bash
   npx convex run customers:seedIfEmpty --prod
   ```

   Az ilyen mutationök idempotensek (jelen `seedIfEmpty` korán visszatér, ha már
   van adat), így újra futtatás biztonságos.

4. **Vercel prod env vars ellenőrzése.** Kötelező minimum:

   ```bash
   vercel env ls production
   ```

   Tartalmaznia kell: `NEXT_PUBLIC_CONVEX_URL` (a prod Convex URL), `CONVEX_DEPLOY_KEY`.
   Hiányzó var hozzáadása:

   ```bash
   vercel env add NEXT_PUBLIC_CONVEX_URL production
   # paste a prod URL-t, pl. https://outstanding-blackbird-570.eu-west-1.convex.cloud
   ```

5. **Vercel prod deploy.** Kétféle mód:

   - **Új build a jelenlegi commit-ből:**

     ```bash
     vercel --prod
     ```

   - **Egy validált preview promótálása prodba** (ajánlott, mert ugyanaz a
     artifact, amit teszteltél):

     ```bash
     vercel promote <preview-deployment-url>
     ```

6. **Smoke-teszt.** Nyisd meg a prod URL-t, vagy gyors HTTP check:

   ```bash
   curl -I https://<a-projekt>.vercel.app
   ```

### Rollback

- **Vercel**: `vercel rollback <deployment-url>` — visszaaliasolja a prod domaint
  egy korábbi (még élő) buildre.
- **Convex**: nincs egy-parancsos rollback. Tartsd meg az előző verzió
  commitját, és deploy-old újra: `git checkout <prev-sha> && npx convex deploy --prod`.
  Adatváltozás visszaforgatásához használj kompenzáló mutationt vagy a backupot
  (`npx convex export --prod` előzetesen).

### Mire jó a `release-manager` / `vercel-deployer` agent

Ugyanezt csinálják, csak fejből végigmennek a pre-flight checklisten (séma diff,
backfill kérdés, env var sanity, build log figyelés, post-deploy spot-check) és
megállnak, ha valami nem kerek. Ha kézzel deploy-olsz, te vagy felelős ezekért
a lépésekért.

## További olvasmány

- Convex + Next.js: <https://docs.convex.dev/quickstart/nextjs>
- Convex Vercel integráció: <https://docs.convex.dev/production/hosting/vercel>
