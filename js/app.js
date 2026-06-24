/* app.js — UI wiring, rendering, and the mood-insight engine. */
(function () {
  "use strict";

  var data = Store.load();

  /* ---------- Insight engine ---------- */

  var PHASE_MOOD = {
    menstrual: {
      title: "Rest & Reflection",
      body: "Energy runs low as your body sheds and resets. Honor the urge to slow down, journal, and be gentle with yourself."
    },
    follicular: {
      title: "Rising Energy",
      body: "Estrogen is climbing and so is your spark. A great window for new ideas, planning, workouts, and saying yes to things."
    },
    ovulation: {
      title: "Peak & Magnetic",
      body: "You're at your most outgoing and confident. Communication flows easily — lean into connection and bold conversations."
    },
    luteal: {
      title: "Winding Down",
      body: "Progesterone rises and the world turns inward. Sensitivity may sharpen; prioritize comfort, boundaries, and finishing what you started."
    }
  };

  var MOON_MOOD = {
    "New Moon": "a clean slate — set quiet intentions and plant seeds for what's next",
    "Waxing Crescent": "gentle momentum — nurture the things you've just begun",
    "First Quarter": "a push through resistance — make decisions and take action",
    "Waxing Gibbous": "refinement — adjust, polish, and stay the course",
    "Full Moon": "heightened emotion and clarity — feelings run bright, so release what no longer serves you",
    "Waning Gibbous": "gratitude and sharing — reflect on what's worked and pass it on",
    "Last Quarter": "letting go — clear space and forgive, including yourself",
    "Waning Crescent": "surrender and rest — retreat, restore, and dream"
  };

  var ELEMENT_MOOD = {
    Fire:  "Your fire nature wants movement and expression — channel restlessness into something creative.",
    Earth: "Your earth nature craves grounding and routine — small, steady comforts will steady your mood.",
    Air:   "Your air nature lives in the mind — talk it out and give your thoughts somewhere to land.",
    Water: "Your water nature feels everything deeply — give your emotions space without judging them."
  };

  function buildInsight(phase, moon, sunSign, moonSignObj) {
    var p = PHASE_MOOD[phase.key];
    var parts = [];

    parts.push('<p class="lead"><strong>' + p.title + '.</strong> ' + p.body + '</p>');

    var moonText = MOON_MOOD[moon.name] || "";
    parts.push("<p>The <strong>" + moon.name + "</strong> (" +
      Math.round(moon.illumination * 100) + "% lit) brings " + moonText +
      ". With the Moon in <strong>" + moonSignObj.name + "</strong>, your emotional weather leans " +
      elementFlavor(moonSignObj.element) + ".</p>");

    if (sunSign) {
      parts.push("<p>As a Sun-sign <strong>" + sunSign.name + "</strong> (" +
        sunSign.element + "), " + ELEMENT_MOOD[sunSign.element] + "</p>");
    }

    parts.push("<p>" + synthesize(phase.key, moon, moonSignObj) + "</p>");
    return parts.join("");
  }

  function elementFlavor(el) {
    return {
      Fire: "energetic and impulsive",
      Earth: "steady and security-seeking",
      Air: "social and restless",
      Water: "tender and intuitive"
    }[el] || "shifting";
  }

  function synthesize(phaseKey, moon, moonSignObj) {
    var energyUp = (phaseKey === "follicular" || phaseKey === "ovulation");
    var moonUp = moon.waxing;
    if (energyUp && moonUp) {
      return "Both your cycle and the waxing Moon are building — a naturally expansive stretch. Start something.";
    }
    if (!energyUp && !moonUp) {
      return "Your cycle and the waning Moon both invite retreat — permission granted to do less and rest more.";
    }
    if (energyUp && !moonUp) {
      return "Your body is energized while the Moon asks you to release — pour that energy into clearing and finishing, not starting.";
    }
    return "Your cycle leans inward while the Moon builds outside — a tender contrast, so pace yourself and don't over-commit.";
  }

  /* ---------- Rendering helpers ---------- */

  function fmt(date) {
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }
  function fmtShort(date) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function el(html) {
    var d = document.createElement("div");
    d.innerHTML = html.trim();
    return d.firstChild;
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
    var greeting = data.name ? "Hello, " + escapeHtml(data.name) + " 🌙" : "Today 🌙";

    if (pred.hasData) {
      html += '<div class="card hero">' +
        '<div class="muted">' + greeting + " — " + fmt(today) + "</div>" +
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
        '<div class="muted">' + greeting + " — " + fmt(today) + "</div>" +
        '<p>Log your first period in the <strong>History</strong> tab to unlock cycle-day and phase tracking.</p>' +
      "</div>";
    }

    // Cosmic tiles
    html += '<div class="card"><div class="cosmic-grid">' +
      cosmicTile(moon.glyph, "Moon Phase", moon.name, Math.round(moon.illumination * 100) + "% illuminated") +
      cosmicTile(moonSignObj.glyph, "Moon Sign", moonSignObj.name, moonSignObj.element) +
      "</div>";
    if (sunSign) {
      html += '<div class="cosmic-grid" style="margin-top:14px">' +
        cosmicTile(sunSign.glyph, "Your Sun Sign", sunSign.name, sunSign.element) +
        cosmicTile("✨", "Element Balance", sunSign.element + " + " + moonSignObj.element,
          sunSign.element === moonSignObj.element ? "Aligned" : "Blended") +
        "</div>";
    }
    html += "</div>";

    // Insight
    if (pred.hasData) {
      html += '<div class="card insight"><h2>Today\'s mood insight</h2>' +
        buildInsight(pred.phase, moon, sunSign, moonSignObj) + "</div>";
    } else {
      html += '<div class="card insight"><h2>Cosmic mood</h2>' +
        "<p>The <strong>" + moon.name + "</strong> with the Moon in <strong>" + moonSignObj.name +
        "</strong> suggests your emotional weather leans " + elementFlavor(moonSignObj.element) + ". " +
        (MOON_MOOD[moon.name] ? "It's a time for " + MOON_MOOD[moon.name] + "." : "") +
        "</p>";
      if (!sunSign) html += '<p class="muted">Add your birthday in Settings for a personalized Sun-sign reading.</p>';
      html += "</div>";
    }

    container.innerHTML = html;
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
      ? "Based on your logged history."
      : "Based on your default cycle length (log 2+ periods for personalized predictions).";

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
      preview.textContent = "Your Sun sign: " + s.glyph + " " + s.name + " (" + s.element + ")";
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
