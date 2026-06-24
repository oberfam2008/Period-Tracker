# 🌙 Luna — Period & Cosmic Tracker

A self-contained period and ovulation tracker that connects your cycle with
**moon phases** and **astrological star signs** to offer reflective mood
insights. No accounts, no servers, no build step — your data stays in your
browser (`localStorage`).

## Features

### 🗓️ Daily tab
- Current **cycle day** and **phase** (menstrual / follicular / ovulation / luteal)
- Today's **moon phase** with illumination %, and the **moon's zodiac sign**
- Your **sun sign** (from your birthday) and element balance
- A combined **mood insight** that weaves cycle phase + moon + astrology together

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
