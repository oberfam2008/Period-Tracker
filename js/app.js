/* app.js — UI wiring, rendering, the mood-insight engine, and partner tips.
 *
 * Framing: this app helps a partner understand and support the person whose
 * cycle is being tracked. Insights and tips are written in the third person
 * ("she / her") and kept plain and practical.
 */
(function () {
  "use strict";

  var data = Store.load();

  /* Display name helpers (fall back gracefully when no name is set). */
  function herName() { return data.name ? escapeHtml(data.name) : "She"; }
  function herLower() { return data.name ? escapeHtml(data.name) : "she"; }
  function herPossessive() { return data.name ? escapeHtml(data.name) + "'s" : "her"; }

  /* ---------- Insight engine ---------- */

  var PHASE_MOOD = {
    menstrual: {
      title: "Rest & Recovery",
      body: "Her energy is likely at its lowest as her body resets. She may feel tired, crampy, or want to retreat from the world. Comfort, quiet, and low-key plans are your friend this week."
    },
    follicular: {
      title: "Rising Energy",
      body: "Estrogen is climbing and her mood and energy are rising with it. She tends to feel more open, optimistic, and up for new things right now — a naturally bright stretch."
    },
    ovulation: {
      title: "Peak & Outgoing",
      body: "She's likely at her most confident, social, and affectionate. Connection and conversation come easily — this is the warmest, most magnetic window of the month."
    },
    luteal: {
      title: "Winding Down",
      body: "Hormones are shifting and the world turns inward for her. She may be more sensitive, tired, or easily irritated — especially in the few days right before her period. Patience matters most now."
    }
  };

  var MOON_MOOD = {
    "New Moon": "a fresh start and quiet intentions",
    "Waxing Crescent": "gentle, building momentum",
    "First Quarter": "drive and a push to take action",
    "Waxing Gibbous": "focus and fine-tuning",
    "Full Moon": "heightened emotions and intensity — feelings run bright",
    "Waning Gibbous": "reflection and gratitude",
    "Last Quarter": "letting go and clearing space",
    "Waning Crescent": "rest, retreat, and recharging"
  };

  /* How her SUN-sign element tends to color her temperament. */
  var SUN_ELEMENT = {
    Fire:  "Her fire sign craves action and passion — restlessness often shows up as a need to move, do, or get out of the house.",
    Earth: "Her earth sign craves stability and comfort — small, reliable gestures mean more to her than grand ones.",
    Air:   "Her air sign lives in ideas and conversation — she'll want to talk things through and feel mentally engaged.",
    Water: "Her water sign feels everything deeply — emotions run close to the surface and need room to be felt."
  };

  /* How the MOON-sign element colors her emotional weather today. */
  var MOON_ELEMENT = {
    Fire:  "energetic and quick to react",
    Earth: "steady and seeking comfort",
    Air:   "social, talkative, and a little restless",
    Water: "tender, intuitive, and emotionally open"
  };

  /* Interpret the blend of her sun element and today's moon element. */
  function balanceText(sunEl, moonEl) {
    if (sunEl === moonEl) {
      return "Her core nature and today's mood are both <strong>" + sunEl +
        "</strong> — that energy is amplified, so expect a strong dose of it.";
    }
    var pair = [sunEl, moonEl].sort().join("-");
    var map = {
      "Air-Fire": "Fire and Air feed each other — she's expressive, lively, and ready to engage. Match her spark.",
      "Earth-Water": "Earth and Water nourish each other — a grounded, nurturing mood. Cozy, caring gestures land well.",
      "Fire-Water": "Fire meets Water — passion and deep feeling can clash into steam. Emotions may run hot; stay calm and don't take heat personally.",
      "Earth-Fire": "Fire meets Earth — drive versus caution. She may feel pulled between wanting to act and wanting to stay safe; don't rush her.",
      "Air-Earth": "Air meets Earth — restlessness versus routine. Give her both a little novelty and a little stability.",
      "Air-Water": "Air meets Water — thoughts versus feelings. She may want to talk and feel at the same time; listen first, solve later."
    };
    return map[pair] || "Her sun and the moon mix two different energies today — expect a blend of both.";
  }

  /* Full insight: phase + moon + sun + moon-sign + element balance. */
  function buildInsight(phase, moon, sunSign, moonSignObj) {
    var p = PHASE_MOOD[phase.key];
    var parts = [];

    var lead = data.name ? p.body.replace(/^Her\b/, escapeHtml(data.name) + "'s") : p.body;
    parts.push('<p class="lead"><strong>' + p.title + ".</strong> " + lead + "</p>");

    parts.push("<p><strong>The Moon &amp; her feelings.</strong> Today's <strong>" +
      moon.name + "</strong> (" + Math.round(moon.illumination * 100) +
      "% lit) carries " + (MOON_MOOD[moon.name] || "a shifting mood") +
      ". With the Moon in <strong>" + moonSignObj.name + "</strong> (" +
      moonSignObj.element + "), her emotional weather today leans <strong>" +
      (MOON_ELEMENT[moonSignObj.element] || "shifting") + "</strong>.</p>");

    if (sunSign) {
      parts.push("<p><strong>Her sun sign.</strong> As a <strong>" + sunSign.name +
        "</strong> (" + sunSign.element + "), " + SUN_ELEMENT[sunSign.element] + "</p>");
      parts.push("<p><strong>Element balance.</strong> " +
        balanceText(sunSign.element, moonSignObj.element) + "</p>");
    } else {
      parts.push('<p class="muted"><strong>Tip:</strong> Add her birthday in Settings to unlock ' +
        "her sun sign and a personalized element-balance reading.</p>");
    }

    parts.push("<p><strong>The big picture.</strong> " +
      synthesize(phase.key, moon) + "</p>");
    return parts.join("");
  }

  function synthesize(phaseKey, moon) {
    var energyUp = (phaseKey === "follicular" || phaseKey === "ovulation");
    var moonUp = moon.waxing;
    if (energyUp && moonUp) {
      return "Both her cycle and the waxing Moon are building — a naturally upbeat, outgoing stretch. A great time to make plans together and lean into connection.";
    }
    if (!energyUp && !moonUp) {
      return "Her cycle and the waning Moon both invite slowing down — expect a quieter, more inward mood. Comfort and patience will go a long way.";
    }
    if (energyUp && !moonUp) {
      return "Her body is energized while the Moon winds down — a mixed signal. She may want to do things but tire quickly, so keep plans flexible.";
    }
    return "Her cycle leans inward while the Moon builds outside — a tender contrast. Don't over-schedule her, and let her set the pace.";
  }

  /* ---------- Practical partner tips ---------- */

  var PHASE_TIPS = {
    menstrual: {
      good: [
        "🍜 Bring home takeout or her comfort food — cooking is the last thing she wants tonight.",
        "🛋️ Set up a cozy night in: heating pad, blanket, her favorite show.",
        "🧹 Quietly handle a chore or two without being asked.",
        "😴 Keep plans low-key and let her rest as much as she needs."
      ],
      hold: [
        "📅 Don't push big decisions or pack the weekend with plans.",
        "🙊 Skip criticism or \"why didn't you…\" questions today.",
        "🎉 This isn't the week for a packed social calendar."
      ]
    },
    follicular: {
      good: [
        "✨ Suggest a date or try something new together — her energy is climbing.",
        "💬 Good window to talk through plans or decisions; she's more open now.",
        "🚗 Be a little spontaneous — she's up for an adventure."
      ],
      hold: [
        "🐢 Don't assume she still wants the quiet routine of last week."
      ]
    },
    ovulation: {
      good: [
        "💃 Plan a date night — she's feeling her most confident and social.",
        "💕 Compliments and affection really land today.",
        "🌟 A great time for a deeper conversation or making plans together."
      ],
      hold: [
        "⏳ Don't let the day slip by without some quality time."
      ]
    },
    luteal: {
      good: [
        "🍫 Stock up on her favorite snacks and treats.",
        "🤗 Lead with patience and reassurance — a little goes a long way.",
        "🧺 Lighten her load: handle dishes, errands, or dinner.",
        "🕯️ A cozy night in beats a big night out right now."
      ],
      hold: [
        "💸 Today may not be the day to bring up money or big plans.",
        "🤐 Steer clear of criticism or other sensitive topics.",
        "📵 Don't overcommit her to social events."
      ]
    }
  };

  var ELEMENT_TIP = {
    Fire:  "🔥 She may want to move — offer a walk, a drive, or getting out of the house.",
    Earth: "🌿 Small comforts and reliability matter most to her today.",
    Air:   "💭 She'll appreciate being heard — ask how she's doing and really listen.",
    Water: "💧 Lead with empathy; acknowledge her feelings before jumping to solutions."
  };

  function buildTips(phase, moon, sunSign) {
    var t = PHASE_TIPS[phase.key];
    var good = t.good.slice();
    var hold = t.hold.slice();

    if (sunSign && ELEMENT_TIP[sunSign.element]) {
      good.push(ELEMENT_TIP[sunSign.element]);
    }
    if (moon.name === "Full Moon") {
      hold.push("🌕 Emotions may run high under the full moon — be the calm one and give a little extra space.");
    }

    function list(items) {
      return "<ul class=\"tip-list\">" +
        items.map(function (i) { return "<li>" + i + "</li>"; }).join("") +
        "</ul>";
    }

    return '<div class="tips-cols">' +
      '<div class="tips-col tips-good"><h3>👍 Good ideas today</h3>' + list(good) + "</div>" +
      '<div class="tips-col tips-hold"><h3>✋ Maybe hold off on</h3>' + list(hold) + "</div>" +
    "</div>";
  }

  /* ---------- Rendering helpers ---------- */

  function fmt(date) {
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }
  function fmtShort(date) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  /* ---------- Daily tab ---------- */

  function renderDaily() {
    var container = document.getElementById("daily-content");
    var today = new Date();
    var moon = Astro.moonPhase(today);
    var moonSignObj = Astro.moonSign(today);
    var sunSign = data.birthday ? Astro.sunSign(new Date(data.birthday + "T00:00:00")) : null;
    var pred = Cycle.predict(data.periods, data, today);

    var html = "";
    var title = data.name ? escapeHtml(data.name) + "'s day 🌙" : "Today 🌙";

    if (pred.hasData) {
      html += '<div class="card hero">' +
        '<div class="muted">' + title + " — " + fmt(today) + "</div>" +
        '<div class="muted">Cycle day</div>' +
        '<div class="cycle-day">' + pred.dayOfCycle + "</div>" +
        '<span class="phase-badge phase-' + pred.phase.key + '">' + pred.phase.label + " phase</span>" +
        '<div class="muted" style="margin-top:10px">' +
          (pred.daysUntilNext === 0 ? "Period expected today"
            : "Next period in " + pred.daysUntilNext + " day" + (pred.daysUntilNext === 1 ? "" : "s")) +
          (pred.isOvulationDay ? " • Ovulation today 🌟"
            : pred.isFertile ? " • Fertile window 💧" : "") +
        "</div>" +
      "</div>";
    } else {
      html += '<div class="card hero">' +
        '<div class="muted">' + title + " — " + fmt(today) + "</div>" +
        "<p>Log her first period in the <strong>History</strong> tab to unlock cycle-day and phase tracking.</p>" +
      "</div>";
    }

    // Cosmic tiles
    html += '<div class="card"><div class="cosmic-grid">' +
      cosmicTile(moon.glyph, "Moon Phase", moon.name, Math.round(moon.illumination * 100) + "% illuminated") +
      cosmicTile(moonSignObj.glyph, "Moon Sign", moonSignObj.name, moonSignObj.element + " element") +
      "</div>";
    if (sunSign) {
      html += '<div class="cosmic-grid" style="margin-top:14px">' +
        cosmicTile(sunSign.glyph, "Her Sun Sign", sunSign.name, sunSign.element + " element") +
        cosmicTile("✨", "Element Balance", sunSign.element + " + " + moonSignObj.element,
          sunSign.element === moonSignObj.element ? "Amplified" : "Blended") +
        "</div>";
    }
    html += "</div>";

    // Cosmic mood insight (always shown, with or without cycle data)
    var insightPhase = pred.hasData ? pred.phase : { key: "follicular", label: "Follicular" };
    html += '<div class="card insight"><h2>🔮 Cosmic mood</h2>';
    if (pred.hasData) {
      html += buildInsight(pred.phase, moon, sunSign, moonSignObj);
    } else {
      // No cycle data yet: still give the full moon/sun/element reading.
      html += buildCosmicOnly(moon, sunSign, moonSignObj);
    }
    html += "</div>";

    // Practical tips for the partner
    html += '<div class="card tips"><h2>💡 Tips &amp; ideas for today</h2>' +
      '<p class="muted">Simple, practical ways to support ' + herLower() + " today.</p>" +
      buildTips(insightPhase, moon, sunSign) +
    "</div>";

    container.innerHTML = html;
  }

  /* Cosmic reading when no cycle data is logged yet. */
  function buildCosmicOnly(moon, sunSign, moonSignObj) {
    var parts = [];
    parts.push('<p class="lead"><strong>Today\'s sky.</strong> The <strong>' + moon.name +
      "</strong> (" + Math.round(moon.illumination * 100) + "% lit) carries " +
      (MOON_MOOD[moon.name] || "a shifting mood") + ".</p>");
    parts.push("<p><strong>The Moon &amp; her feelings.</strong> With the Moon in <strong>" +
      moonSignObj.name + "</strong> (" + moonSignObj.element + "), her emotional weather today leans <strong>" +
      (MOON_ELEMENT[moonSignObj.element] || "shifting") + "</strong>.</p>");
    if (sunSign) {
      parts.push("<p><strong>Her sun sign.</strong> As a <strong>" + sunSign.name + "</strong> (" +
        sunSign.element + "), " + SUN_ELEMENT[sunSign.element] + "</p>");
      parts.push("<p><strong>Element balance.</strong> " +
        balanceText(sunSign.element, moonSignObj.element) + "</p>");
    } else {
      parts.push('<p class="muted"><strong>Tip:</strong> Add her birthday in Settings for her sun sign ' +
        "and a personalized element-balance reading. Log a period in History to add cycle-phase insights too.</p>");
    }
    return parts.join("");
  }

  function cosmicTile(glyph, label, value, sub) {
    return '<div class="cosmic-tile">' +
      '<div class="glyph">' + glyph + "</div>" +
      '<div class="label">' + label + "</div>" +
      '<div class="value">' + escapeHtml(value) + "</div>" +
      '<div class="sub">' + escapeHtml(sub) + "</div>" +
    "</div>";
  }

  /* ---------- History tab ---------- */

  function renderHistory() {
    renderPredictions();
    renderHistoryList();
  }

  function renderPredictions() {
    var container = document.getElementById("prediction-content");
    var pred = Cycle.predict(data.periods, data, new Date());
    if (!pred.hasData) {
      container.innerHTML = "";
      return;
    }
    var srcNote = pred.cycleSource === "history"
      ? "Based on her logged history."
      : "Based on the default cycle length (log 2+ periods for personalized predictions).";

    container.innerHTML =
      '<div class="card">' +
        "<h2>Predictions</h2>" +
        '<div class="pred-grid">' +
          predTile("dot-period", "Next period", fmtShort(pred.nextPeriod), pred.daysUntilNext + "d") +
          predTile("dot-ovulation", "Ovulation", fmtShort(pred.ovulation), "") +
          predTile("dot-fertile", "Fertile window", fmtShort(pred.fertileStart) + "–" + fmtShort(pred.fertileEnd), "") +
        "</div>" +
        '<p class="muted" style="margin-top:14px">Average cycle: <strong>' + pred.cycleLength +
          " days</strong>. " + srcNote + "</p>" +
      "</div>";
  }

  function predTile(dotClass, label, big, badge) {
    return '<div class="pred-tile">' +
      '<div class="lbl"><span class="dot ' + dotClass + '"></span>' + label + "</div>" +
      '<div class="big">' + big + "</div>" +
      (badge ? '<div class="muted">in ' + badge + "</div>" : "") +
    "</div>";
  }

  function renderHistoryList() {
    var container = document.getElementById("history-list");
    if (!data.periods.length) {
      container.innerHTML = '<div class="card empty">No periods logged yet.</div>';
      return;
    }
    var starts = data.periods
      .map(function (p) { return new Date(p + "T00:00:00"); })
      .sort(function (a, b) { return b - a; });

    var html = '<div class="card"><h2>Logged periods</h2>';
    for (var i = 0; i < starts.length; i++) {
      var d = starts[i];
      var iso = toIso(d);
      var meta = "";
      if (i < starts.length - 1) {
        var gap = Cycle.daysBetween(starts[i + 1], d);
        meta = gap + "-day cycle";
      } else {
        meta = "first logged";
      }
      html += '<div class="history-item">' +
        "<div><div>" + fmt(d) + "</div><div class=\"meta\">" + meta + "</div></div>" +
        '<button data-del="' + iso + '">Remove</button>' +
      "</div>";
    }
    html += "</div>";
    container.innerHTML = html;

    container.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var iso = btn.getAttribute("data-del");
        data.periods = data.periods.filter(function (p) { return p !== iso; });
        Store.save(data);
        renderHistory();
        renderDaily();
      });
    });
  }

  /* ---------- Settings tab ---------- */

  function renderSettings() {
    document.getElementById("set-name").value = data.name || "";
    document.getElementById("set-birthday").value = data.birthday || "";
    document.getElementById("set-cycle").value = data.cycleLength;
    document.getElementById("set-period").value = data.periodLength;
    updateSunPreview();
  }

  function updateSunPreview() {
    var bday = document.getElementById("set-birthday").value;
    var preview = document.getElementById("sun-sign-preview");
    if (bday) {
      var s = Astro.sunSign(new Date(bday + "T00:00:00"));
      preview.textContent = "Her Sun sign: " + s.glyph + " " + s.name + " (" + s.element + ")";
    } else {
      preview.textContent = "";
    }
  }

  /* ---------- Utilities ---------- */

  function toIso(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Wiring ---------- */

  function setupTabs() {
    var tabs = document.querySelectorAll(".tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-tab");
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
        document.getElementById(name).classList.add("active");
        if (name === "daily") renderDaily();
        if (name === "history") renderHistory();
        if (name === "settings") renderSettings();
      });
    });
  }

  function setupHistoryControls() {
    var dateInput = document.getElementById("log-date");
    dateInput.value = toIso(new Date());
    document.getElementById("log-add").addEventListener("click", function () {
      var v = dateInput.value;
      if (!v) return;
      if (data.periods.indexOf(v) === -1) {
        data.periods.push(v);
        Store.save(data);
        renderHistory();
        renderDaily();
      }
    });
  }

  function setupSettingsControls() {
    document.getElementById("set-birthday").addEventListener("change", updateSunPreview);

    document.getElementById("set-save").addEventListener("click", function () {
      data.name = document.getElementById("set-name").value.trim();
      data.birthday = document.getElementById("set-birthday").value;
      data.cycleLength = clampNum(document.getElementById("set-cycle").value, 20, 45, 28);
      data.periodLength = clampNum(document.getElementById("set-period").value, 1, 10, 5);
      Store.save(data);
      var status = document.getElementById("save-status");
      status.textContent = "Saved ✓";
      setTimeout(function () { status.textContent = ""; }, 2000);
      renderSettings();
      renderDaily();
    });

    document.getElementById("set-clear").addEventListener("click", function () {
      if (!confirm("Clear all data? This cannot be undone.")) return;
      Store.clear();
      data = Store.load();
      renderSettings();
      renderHistory();
      renderDaily();
    });
  }

  function clampNum(v, min, max, fallback) {
    var n = parseInt(v, 10);
    if (isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function init() {
    setupTabs();
    setupHistoryControls();
    setupSettingsControls();
    renderDaily();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
