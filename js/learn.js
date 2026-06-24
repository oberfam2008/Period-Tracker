/* learn.js — aggregates logged encounters and notes by cycle phase so the
 * app can refine its intimacy advice from real, observed data.
 */
(function (global) {
  "use strict";

  // Lightweight mood vocabulary for surfacing patterns from free-text notes.
  var KEYWORDS = [
    "tired", "exhausted", "cramps", "pain", "headache", "bloated", "nausea",
    "moody", "irritable", "emotional", "sad", "anxious", "stressed", "angry",
    "happy", "energetic", "affectionate", "playful", "calm", "confident",
    "hungry", "cravings", "horny", "low", "sensitive"
  ];

  function empty() {
    return { count: 0, sumDesire: 0, sumAdventure: 0, her: 0, him: 0, mutual: 0 };
  }

  /* Returns { encounters: {stageKey -> stats}, notes: {stageKey -> {kw:count}} }. */
  function analyze(data) {
    var enc = {};
    var notes = {};

    (data.encounters || []).forEach(function (e) {
      var c = Cycle.classifyDate(data.periods, data, new Date(e.date + "T00:00:00"));
      if (!c) return;
      var k = c.stageKey;
      if (!enc[k]) enc[k] = empty();
      var s = enc[k];
      s.count++;
      s.sumDesire += Number(e.desire) || 0;
      s.sumAdventure += Number(e.adventure) || 0;
      if (e.initiator === "her") s.her++;
      else if (e.initiator === "him") s.him++;
      else s.mutual++;
    });

    // finalize averages + initiator tendency
    Object.keys(enc).forEach(function (k) {
      var s = enc[k];
      s.avgDesire = s.sumDesire / s.count;
      s.avgAdventure = s.sumAdventure / s.count;
      s.initiator = topInitiator(s);
    });

    (data.notes || []).forEach(function (n) {
      var c = Cycle.classifyDate(data.periods, data, new Date(n.date + "T00:00:00"));
      if (!c) return;
      var k = c.stageKey;
      if (!notes[k]) notes[k] = {};
      var text = (n.text || "").toLowerCase();
      KEYWORDS.forEach(function (kw) {
        if (text.indexOf(kw) !== -1) notes[k][kw] = (notes[k][kw] || 0) + 1;
      });
    });

    return { encounters: enc, notes: notes };
  }

  function topInitiator(s) {
    if (s.her >= s.him && s.her >= s.mutual) return "her";
    if (s.him >= s.her && s.him >= s.mutual) return "him";
    return "mutual";
  }

  /* Top N keywords for a phase as [ "tired (3)", ... ]. */
  function topKeywords(notesForStage, n) {
    if (!notesForStage) return [];
    return Object.keys(notesForStage)
      .map(function (k) { return { k: k, c: notesForStage[k] }; })
      .sort(function (a, b) { return b.c - a.c; })
      .slice(0, n || 3)
      .map(function (o) { return o.k + " (" + o.c + ")"; });
  }

  global.Learn = { analyze: analyze, topKeywords: topKeywords };
})(typeof window !== "undefined" ? window : this);
