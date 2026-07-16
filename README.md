# HerRhythm — Cycle Companion

A tracker that helps a partner understand and support the person whose cycle
is being tracked, connecting **her cycle** with **moon phases** and
**astrological star signs** for plain-language mood insights and practical,
day-to-day tips. It's a real multi-user app — anyone can create their own
account, and every account's data is private to them (see
[Accounts & sharing](#-accounts--sharing)).

## 🎨 Design

Grounded, masculine, and caring — like a thoughtful guide, not clinical or
feminine. Earthy, nature-inspired palette (forest, slate, ember) on a warm,
light background.

| Token | Hex | Purpose |
|---|---|---|
| Deep Forest | `#3A4D3E` | Primary — buttons, active nav, headers |
| Slate Ink | `#4A5A6F` | Secondary — calm/intelligent accents, luteal phase |
| Warm Ember | `#C67C4E` | Accent — highlights, data, ovulation |
| Charcoal | `#2A2A2D` | Primary text |
| Stone Gray | `#9B9B9B` | Quiet captions |
| Warm Gray | `#F4F1ED` | App background |
| Off-White | `#FAFAF8` | Cards |

Typography (loaded from Google Fonts in `index.html`):
- **Cormorant Garamond** (600/700) — display: headers & emphasis
- **Inter** (400/500/600) — body: main content
- **IBM Plex Mono** (400) — data/captions: cycle numbers, tags, phase chips

All colors and fonts are defined as CSS custom properties at the top of
`css/styles.css`, so the whole app re-themes from one place. A **dark theme**
(warm near-black, not pure black) is available via `[data-theme="dark"]`
overrides; Settings → Appearance offers System / Light / Dark, applied before
paint to avoid a flash.

> Note: pure Stone Gray (`#9B9B9B`) fails contrast for small text on the light
> background, so secondary text uses a slightly deeper stone (`--muted`) for
> legibility; `#9B9B9B` (`--stone`) is reserved for larger/decorative captions.

## Features

### 🗓️ Daily tab
- Current **cycle day** and **phase** (menstrual / follicular / ovulation / luteal)
- Today's **moon phase** with illumination %, and the **moon's zodiac sign**
- Her **sun sign** (from her birthday) shown alongside the moon sign
- A detailed, **non-repeating cosmic mood** reading (Co-Star style): each day is
  assembled from large phrasing pools with a date-seeded RNG and woven together
  with cycle phase + sub-stage, moon phase, moon sign, sun sign, the **element
  balance** between them, dynamic cycle-day detail, and a closing aphorism —
  stable through the day, fresh tomorrow
- A **Tips & Ideas** card with simple, practical do's and don'ts for the day
  (e.g. *"today may not be the day to bring up money"*, *"bring home takeout"*)
- An **Intimacy outlook** card: likely desire and adventurousness meters, an
  "initiate today?" verdict, and tasteful, cycle-aware guidance — always
  consent-forward and able to be hidden from Settings. **It learns**: as you log
  encounters, observed averages and who-usually-initiates are blended into the
  advice for each phase. It can also offer a **suggested position idea** tuned
  to the day's adventurousness score (toggleable in Settings).

### 📓 Journal tab
- Add free-text **notes** about how she seemed; the app tags recurring mood
  keywords by cycle phase
- Log **encounters** rated on the same Desire (1–5) and Adventurousness (1–5)
  scales, plus who initiated
- A **Patterns learned** summary per phase and a phase-tagged timeline of entries

### 🧠 How the learning works
Every encounter is bucketed by the cycle phase it fell in (menstrual,
follicular, ovulation, early/late luteal). For the current phase the outlook
blends the built-in model with your observed averages, weighted by sample size
(`weight = n / (n + 2)`), so a couple of logs nudge the advice and many logs
largely drive it. Notes are scanned for a small mood vocabulary to surface
"what you've noticed before" in each phase.

### 📊 History tab
- Log the first day of each period (and optionally the last day)
- See **next-period**, **ovulation**, and **fertile-window** estimates
- Average **cycle length** computed from your own logged history (start-date gaps)
- Average **period length** learned from logged end dates (inclusive duration),
  falling back to the Settings value until end dates exist
- Full list of logged periods with per-cycle gaps and durations; set or edit any
  period's last day inline

### 📅 Calendar tab
- Color-coded month grid of cycle phases (projected forward past the last log)
- Logged period days, fertile window, ovulation, and today are marked; days with
  a journal note or logged encounter get a dot
- Previous/next month navigation with a legend

### 🔔 Install & reminders (PWA)
- Installable to the home screen with offline support (web app manifest +
  service worker; network-first so updates apply on reload).
- Optional **reminders** (Settings → Reminders) for key days: period due/late,
  fertile-window open & ovulation, a PMS heads-up (3 days before), and phase
  changes. Toggling them on requests notification permission.
- **Web limitation:** browser notifications fire when you open the app (there's
  no backend push). For true scheduled alerts while the app is closed, the
  Capacitor build can swap in `@capacitor/local-notifications` — the reminder
  rules already live in `dueReminders()`.

### ⚙️ Settings tab
- **Account**: signed-in email + sign out
- Name and **birthday** (drives your sun sign)
- Default **cycle** and **period** lengths
- Clear-all-data control

## 👤 Accounts & sharing

HerRhythm is a real multi-user app, backed by [Supabase](https://supabase.com)
(hosted Postgres + auth). Anyone can create their own account from the sign-in
screen; **each account's data is private to that account** — there's no way
for one user to see another's data.

- **Sign up / sign in** — email + password. New accounts may need to confirm
  their email first, depending on the Supabase project's auth settings (see
  below).
- **Forgot password** — sends a reset-password email; clicking the link
  returns you to the app with a "set new password" form.
- **Sign out** — Settings → Account.

### How data isolation works

All of an account's data (name, birthday, logged periods, journal, settings —
everything `js/storage.js` used to keep in `localStorage`) lives in one row of
a `user_data` table, keyed by `user_id`. **Row-level security (RLS)** policies
on that table restrict every select/insert/update/delete to
`auth.uid() = user_id`, enforced by Postgres itself — not just app-level
checks. This was verified directly against the live database: a second
simulated user could not read, update, or delete the first user's row, and an
attempt to insert data under someone else's `user_id` was rejected outright.

### Setting up your own Supabase project

The app ships pointed at a project already set up with the right schema
(`js/supabase-config.js` holds the project URL and a publishable/anon key —
safe to expose client-side, since RLS is what actually protects the data, not
secrecy of that key). To point it at your own project instead:

1. Create a Supabase project and note its URL and **publishable** key
   (Project Settings → API). Never put the **service_role** key in client code.
2. Run the schema in the SQL editor:
   ```sql
   create table public.user_data (
     user_id uuid primary key references auth.users(id) on delete cascade,
     data jsonb not null default '{}'::jsonb,
     updated_at timestamptz not null default now()
   );
   alter table public.user_data enable row level security;
   create policy "select own data" on public.user_data for select using (auth.uid() = user_id);
   create policy "insert own data" on public.user_data for insert with check (auth.uid() = user_id);
   create policy "update own data" on public.user_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
   create policy "delete own data" on public.user_data for delete using (auth.uid() = user_id);
   ```
3. Update `js/supabase-config.js` with your project's URL and publishable key.
4. In Authentication → Providers → Email, decide whether to require email
   confirmation. Leaving it on is more secure for a public deployment; turning
   it off makes testing/onboarding frictionless (useful while you're the only
   user). Either way, Supabase's default email sending has fair-use limits —
   configure custom SMTP before real-world signup volume.

### A note on responsibility

Making this shareable means cycle, journal, and intimacy data for other people
now lives in a real hosted database instead of only on their own device. That's
a deliberate trade-off for "a product other people can use," but it's worth
taking seriously given how sensitive this data is: keep the Supabase dashboard
access locked down, and if you're sharing this beyond a few trusted people,
write a short privacy note for users about what's stored and where.

### Backup & restore

**Settings → Backup & restore** still lets you **export** your account's data
to a JSON file and **import** it back — useful as an extra safety net, or to
move data if you ever change accounts.

### Mobile / offline storage backends (still available)

`js/storage.js` remains a pluggable backend: `localStorage` is used before
sign-in (and as a resilience cache mirroring the last-synced cloud data, so a
brief network drop doesn't reset the UI to defaults), and if the app is
wrapped with [Capacitor](https://capacitorjs.com/) and the
`@capacitor/preferences` plugin is present, durable native storage is detected
automatically for local-only builds.

## Running it locally

It's plain HTML/CSS/JS — just open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Sign-in requires network access (to reach Supabase) even when running locally.

## 🌐 Deploying to Netlify (making it shareable)

The app is a static site — no build step, no server of your own to run, since
Supabase is the backend. `netlify.toml` is already set up: `publish = "."`
(deploy the repo as-is) and a small set of low-risk production headers
(`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, plus
`Cache-Control: no-cache` on `index.html`/`sw.js`/`manifest.webmanifest`/
`js/*`/`css/*` — this project doesn't fingerprint filenames, so those need to
revalidate on every load or a redeploy wouldn't reach users promptly).

**Pick one way to deploy:**

- **Drag-and-drop (no account setup, no CLI):** go to
  [app.netlify.com/drop](https://app.netlify.com/drop) and drag the project
  folder in. You get a live URL immediately. To update later, drag the folder
  in again.
- **Git-connected (auto-deploys on every push — recommended):** on
  [app.netlify.com](https://app.netlify.com), *Add new site → Import an
  existing project*, pick this repo/branch. Build command: leave **blank**.
  Publish directory: `.`. Netlify reads the rest from `netlify.toml`.
- **CLI:** `npm install -g netlify-cli`, then from the project root:
  `netlify login`, `netlify init` (or `netlify link` to an existing site),
  `netlify deploy --prod`.

No environment variables to set at Netlify — the Supabase URL and publishable
key already live in `js/supabase-config.js` and are meant to ship with the
client (see [Accounts & sharing](#-accounts--sharing) for why that's safe).

### ⚠️ Required after your first deploy: tell Supabase the live URL

Password-reset and email-confirmation links only redirect correctly to URLs
Supabase has been told to trust. Once you have your Netlify URL:

1. Supabase dashboard → your project → **Authentication → URL Configuration**.
2. Set **Site URL** to your Netlify URL (e.g. `https://your-site.netlify.app`).
3. Add the same URL (with `/**`, e.g. `https://your-site.netlify.app/**`) under
   **Redirect URLs**.

Skip this and the "reset password" and "confirm your email" links in signup/
reset emails will land somewhere other than your deployed app.

### Optional: a stricter Content-Security-Policy

`netlify.toml` intentionally does **not** ship a CSP — a wrong one silently
breaks sign-in (the Supabase requests, the auth CDN script, Google Fonts) in
ways that are hard to diagnose without a live deploy to test against. If you
want to harden further, something in this shape is a reasonable starting
point, but **test sign-in/sign-up/password-reset immediately after adding it**:

```
Content-Security-Policy = "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://aydxndyopdskcasaqvuw.supabase.co"
```

Other static hosts work too (Vercel, Cloudflare Pages, GitHub Pages) — the
same `netlify.toml` values just translate to that host's equivalent config.

## How the math works

- **Sun sign** — standard tropical date ranges from your birthday.
- **Moon phase** — synodic month (29.53 days) measured from a known new moon
  (2000-01-06), giving phase name + illumination.
- **Moon sign** — approximate lunar ecliptic longitude (simplified Meeus
  mean-longitude terms) mapped to the zodiac.
- **Predictions** — average gap between logged period starts (falling back to
  your default cycle length); ovulation ≈ 14 days before the next period, with a
  fertile window of the preceding 5 days.

Astronomical figures are simplified approximations suited to a reflective
wellness app.

## Disclaimer

HerRhythm is for personal reflection and entertainment. Cosmic insights are **not**
medical advice, and predictions are estimates — do not rely on them for
contraception or diagnosis.

## Project structure

```
index.html              markup + tab layout + auth screens
css/styles.css          styling (incl. auth/loading states, dark theme)
js/astro.js             sun sign, moon phase, moon sign
js/cycle.js             period/ovulation predictions
js/learn.js             pattern learning from journal/encounters
js/storage.js           pluggable persistence (Supabase / localStorage / Capacitor)
js/auth.js              Supabase Auth wrapper (sign up/in/out, password reset)
js/supabase-config.js   project URL + publishable key
js/app.js               UI wiring, auth-driven app lifecycle, mood-insight engine
manifest.webmanifest    PWA manifest
sw.js                   service worker (offline + notification clicks)
icons/, assets/         app icon and logo
```
