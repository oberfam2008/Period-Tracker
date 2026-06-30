# HerRhythm — Cycle Companion

A self-contained tracker that helps a partner understand and support the person
whose cycle is being tracked, connecting **her cycle** with **moon phases** and
**astrological star signs** for plain-language mood insights and practical,
day-to-day tips. No accounts, no servers, no build step — your data stays
**only on your device** (see [Data & storage](#-data--storage)).

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
- Name and **birthday** (drives your sun sign)
- Default **cycle** and **period** lengths
- Clear-all-data control

## 🔒 Data & storage

HerRhythm is **local-first**: your data never leaves the device and is never uploaded
anywhere. The persistence layer (`js/storage.js`) is a small pluggable backend:

- **Web (default):** browser `localStorage`.
- **Mobile (Capacitor):** if the app is wrapped with Capacitor and the
  `@capacitor/preferences` plugin is present, it is **detected automatically**
  and used instead — durable native storage that is *not* subject to browser
  cache eviction. No code change is needed to switch.

Because a backend may be synchronous (localStorage) or asynchronous (Capacitor),
data is hydrated once into memory via `Store.init()` at startup; after that
`load()` is a synchronous read and `save()` writes through to the backend.

### Backup & restore

Since the data is device-only, **Settings → Backup & restore** lets you:

- **Export** all data to a JSON file (fully on-device, nothing is uploaded).
- **Import** a previously exported file to restore it — also the simplest way to
  move your data between devices without any cloud.

Keep a backup occasionally: clearing browser data (or browser cache eviction on
the web) can otherwise wipe local data.

### Wrapping for mobile (later)

Because the whole app is a self-contained static web app, the lightest path to
Android/iOS is [Capacitor](https://capacitorjs.com/): add `@capacitor/core`,
`@capacitor/preferences`, and the platform projects, point the webDir at this
folder, and durable native storage turns on automatically via the detection above.

## Running it

It's plain HTML/CSS/JS — just open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

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
index.html        markup + tab layout
css/styles.css    styling
js/astro.js       sun sign, moon phase, moon sign
js/cycle.js       period/ovulation predictions
js/storage.js     localStorage persistence
js/app.js         UI wiring + mood-insight engine
```
