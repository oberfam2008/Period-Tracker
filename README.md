# 🌙 Luna — Period & Cosmic Tracker

A self-contained tracker that helps a partner understand and support the person
whose cycle is being tracked, connecting **her cycle** with **moon phases** and
**astrological star signs** for plain-language mood insights and practical,
day-to-day tips. No accounts, no servers, no build step — data stays in the
browser (`localStorage`).

## Features

### 🗓️ Daily tab
- Current **cycle day** and **phase** (menstrual / follicular / ovulation / luteal)
- Today's **moon phase** with illumination %, and the **moon's zodiac sign**
- Her **sun sign** (from her birthday) shown alongside the moon sign
- A detailed **cosmic mood** reading that weaves together cycle phase, moon
  phase, moon sign, sun sign, and the **element balance** between them
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
- Log the first day of each period
- See **next-period**, **ovulation**, and **fertile-window** estimates
- Average **cycle length** computed from your own logged history
- Full list of logged periods with per-cycle gaps

### ⚙️ Settings tab
- Name and **birthday** (drives your sun sign)
- Default **cycle** and **period** lengths
- Clear-all-data control

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

Luna is for personal reflection and entertainment. Cosmic insights are **not**
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
