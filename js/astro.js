/* astro.js — sun signs, moon phase, and approximate moon sign.
 * All calculations are self-contained (no external APIs).
 * Astronomical formulas are simplified approximations suitable for
 * a reflective wellness app, not for ephemeris-grade precision.
 */
(function (global) {
  "use strict";

  var SIGNS = [
    { name: "Aries",       glyph: "♈", element: "Fire",  start: [3, 21] },
    { name: "Taurus",      glyph: "♉", element: "Earth", start: [4, 20] },
    { name: "Gemini",      glyph: "♊", element: "Air",   start: [5, 21] },
    { name: "Cancer",      glyph: "♋", element: "Water", start: [6, 21] },
    { name: "Leo",         glyph: "♌", element: "Fire",  start: [7, 23] },
    { name: "Virgo",       glyph: "♍", element: "Earth", start: [8, 23] },
    { name: "Libra",       glyph: "♎", element: "Air",   start: [9, 23] },
    { name: "Scorpio",     glyph: "♏", element: "Water", start: [10, 23] },
    { name: "Sagittarius", glyph: "♐", element: "Fire",  start: [11, 22] },
    { name: "Capricorn",   glyph: "♑", element: "Earth", start: [12, 22] },
    { name: "Aquarius",    glyph: "♒", element: "Air",   start: [1, 20] },
    { name: "Pisces",      glyph: "♓", element: "Water", start: [2, 19] }
  ];

  // Ecliptic-longitude ordering, starting at Aries (0°).
  var ZODIAC_ORDER = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  function signByName(name) {
    for (var i = 0; i < SIGNS.length; i++) {
      if (SIGNS[i].name === name) return SIGNS[i];
    }
    return null;
  }

  /* Sun sign from a Date (uses month/day boundaries). */
  function sunSign(date) {
    var m = date.getMonth() + 1;
    var d = date.getDate();
    // Capricorn wraps the year; handle late-Dec / early-Jan explicitly.
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return signByName("Capricorn");
    for (var i = 0; i < SIGNS.length; i++) {
      var s = SIGNS[i];
      var next = SIGNS[(i + 1) % SIGNS.length];
      var sm = s.start[0], sd = s.start[1];
      var nm = next.start[0], nd = next.start[1];
      if ((m === sm && d >= sd) || (m === nm && d < nd)) {
        if (s.name === "Capricorn") continue; // handled above
        return s;
      }
    }
    return signByName("Capricorn");
  }

  /* Days since a known new moon (2000-01-06 18:14 UTC). */
  var SYNODIC = 29.53058867;
  var KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0) / 86400000; // in days

  function moonAge(date) {
    var days = date.getTime() / 86400000;
    var age = (days - KNOWN_NEW_MOON) % SYNODIC;
    if (age < 0) age += SYNODIC;
    return age; // 0..29.53
  }

  function moonPhase(date) {
    var age = moonAge(date);
    var frac = age / SYNODIC; // 0..1
    // Illumination fraction (0 new -> 1 full -> 0 new).
    var illum = (1 - Math.cos(2 * Math.PI * frac)) / 2;

    var name, glyph;
    if (age < 1.84566) { name = "New Moon"; glyph = "🌑"; }
    else if (age < 5.53699) { name = "Waxing Crescent"; glyph = "🌒"; }
    else if (age < 9.22831) { name = "First Quarter"; glyph = "🌓"; }
    else if (age < 12.91963) { name = "Waxing Gibbous"; glyph = "🌔"; }
    else if (age < 16.61096) { name = "Full Moon"; glyph = "🌕"; }
    else if (age < 20.30228) { name = "Waning Gibbous"; glyph = "🌖"; }
    else if (age < 23.99361) { name = "Last Quarter"; glyph = "🌗"; }
    else if (age < 27.68493) { name = "Waning Crescent"; glyph = "🌘"; }
    else { name = "New Moon"; glyph = "🌑"; }

    return {
      age: age,
      name: name,
      glyph: glyph,
      illumination: illum,
      waxing: frac < 0.5
    };
  }

  /* Approximate moon sign via mean ecliptic longitude of the Moon.
   * Simplified Meeus mean-longitude term; good to a sign in most cases.
   */
  function moonSign(date) {
    var jd = date.getTime() / 86400000 + 2440587.5; // Unix -> Julian Day
    var T = (jd - 2451545.0) / 36525.0;             // Julian centuries from J2000
    // Mean longitude of the Moon (degrees).
    var L = 218.316 + 13.176396 * (jd - 2451545.0);
    // A couple of leading periodic corrections for better sign accuracy.
    var M = 134.963 + 13.064993 * (jd - 2451545.0); // mean anomaly
    var D = 297.850 + 12.190749 * (jd - 2451545.0); // mean elongation
    L += 6.289 * Math.sin(M * Math.PI / 180);
    L += 1.274 * Math.sin((2 * D - M) * Math.PI / 180);
    L += 0.658 * Math.sin(2 * D * Math.PI / 180);
    var lon = ((L % 360) + 360) % 360;
    var idx = Math.floor(lon / 30) % 12;
    return signByName(ZODIAC_ORDER[idx]);
  }

  global.Astro = {
    SIGNS: SIGNS,
    sunSign: sunSign,
    moonPhase: moonPhase,
    moonSign: moonSign,
    signByName: signByName
  };
})(typeof window !== "undefined" ? window : this);
