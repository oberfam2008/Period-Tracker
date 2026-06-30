/* cycle.js — period/ovulation predictions from logged history. */
(function (global) {
  "use strict";

  var DAY = 86400000;

  function toMidnight(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  // Parse a "YYYY-MM-DD" string as LOCAL midnight (not UTC). Using new Date(str)
  // on a date-only string parses as UTC, which shifts the day backward for
  // users behind UTC and throws cycle-day counts off by one. Constructing from
  // components keeps everything in the user's own timezone.
  function parseLocalDate(value) {
    if (value instanceof Date) return toMidnight(value);
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    return toMidnight(new Date(value));
  }

  function daysBetween(a, b) {
    return Math.round((toMidnight(b) - toMidnight(a)) / DAY);
  }

  function addDays(d, n) {
    var x = toMidnight(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  /* Sorted ascending array of period-start Date objects. */
  function sortedStarts(periods) {
    return periods
      .map(function (p) { return parseLocalDate(p); })
      .sort(function (a, b) { return a - b; });
  }

  /* Average cycle length from gaps between logged starts; falls back to default. */
  function averageCycle(periods, fallback) {
    var starts = sortedStarts(periods);
    if (starts.length < 2) return { length: fallback, source: "default" };
    var gaps = [];
    for (var i = 1; i < starts.length; i++) {
      var g = daysBetween(starts[i - 1], starts[i]);
      if (g >= 15 && g <= 60) gaps.push(g); // ignore implausible entries
    }
    if (!gaps.length) return { length: fallback, source: "default" };
    var avg = gaps.reduce(function (s, g) { return s + g; }, 0) / gaps.length;
    return { length: Math.round(avg), source: "history" };
  }

  /* Build a full prediction object. `today` defaults to now. */
  function predict(periods, settings, today) {
    today = toMidnight(today || new Date());
    var starts = sortedStarts(periods);
    var cycleInfo = averageCycle(periods, settings.cycleLength || 28);
    var cycleLen = cycleInfo.length;
    var periodLen = settings.periodLength || 5;

    if (!starts.length) {
      return { hasData: false, cycleLength: cycleLen, periodLength: periodLen, cycleSource: cycleInfo.source };
    }

    var lastStart = starts[starts.length - 1];

    // Roll forward to the cycle that contains/precedes today.
    var nextPeriod = new Date(lastStart);
    while (daysBetween(nextPeriod, today) >= cycleLen) {
      nextPeriod = addDays(nextPeriod, cycleLen);
    }
    var cycleStart = nextPeriod;
    nextPeriod = addDays(cycleStart, cycleLen);

    var dayOfCycle = daysBetween(cycleStart, today) + 1; // day 1 = first day

    // Ovulation ~14 days before the next period; fertile window = 5 days before + ovulation day.
    var ovulation = addDays(nextPeriod, -14);
    var fertileStart = addDays(ovulation, -5);
    var fertileEnd = ovulation;

    var phase = phaseFor(dayOfCycle, periodLen, ovulation, today);

    return {
      hasData: true,
      cycleLength: cycleLen,
      periodLength: periodLen,
      cycleSource: cycleInfo.source,
      cycleStart: cycleStart,
      dayOfCycle: dayOfCycle,
      nextPeriod: nextPeriod,
      daysUntilNext: daysBetween(today, nextPeriod),
      ovulation: ovulation,
      fertileStart: fertileStart,
      fertileEnd: fertileEnd,
      isFertile: today >= fertileStart && today <= fertileEnd,
      isOvulationDay: daysBetween(today, ovulation) === 0,
      phase: phase
    };
  }

  function phaseFor(dayOfCycle, periodLen, ovulation, today) {
    var toOvu = Math.abs(daysBetween(today, ovulation));
    if (dayOfCycle <= periodLen) {
      return { key: "menstrual", label: "Menstrual" };
    }
    if (toOvu <= 1) {
      return { key: "ovulation", label: "Ovulation" };
    }
    if (today < ovulation) {
      return { key: "follicular", label: "Follicular" };
    }
    return { key: "luteal", label: "Luteal" };
  }

  /* Classify an arbitrary (often past) date into a cycle phase/stage,
   * using the most recent logged period start on or before that date.
   * Returns null if the date precedes all logged periods.
   * stageKey matches the intimacy model keys (splits luteal early/late).
   */
  function classifyDate(periods, settings, date) {
    date = toMidnight(date);
    var starts = sortedStarts(periods);
    if (!starts.length) return null;

    var start = null, nextStart = null;
    for (var i = 0; i < starts.length; i++) {
      if (starts[i] <= date) { start = starts[i]; nextStart = starts[i + 1] || null; }
    }
    if (!start) return null; // date is before the first logged period

    var cycleLen;
    if (nextStart) {
      cycleLen = daysBetween(start, nextStart);
    } else {
      cycleLen = averageCycle(periods, settings.cycleLength || 28).length;
    }
    if (cycleLen < 15 || cycleLen > 60) cycleLen = settings.cycleLength || 28;

    var periodLen = settings.periodLength || 5;
    var dayOfCycle = daysBetween(start, date) + 1;
    var nextPeriod = addDays(start, cycleLen);
    var ovulation = addDays(nextPeriod, -14);
    var daysUntilNext = daysBetween(date, nextPeriod);

    var phaseKey;
    if (dayOfCycle <= periodLen) phaseKey = "menstrual";
    else if (Math.abs(daysBetween(date, ovulation)) <= 1) phaseKey = "ovulation";
    else if (date < ovulation) phaseKey = "follicular";
    else phaseKey = "luteal";

    var stageKey = phaseKey;
    if (phaseKey === "luteal") {
      stageKey = (daysUntilNext <= 4 && daysUntilNext >= 0) ? "luteal_late" : "luteal_early";
    }
    return { phaseKey: phaseKey, stageKey: stageKey, dayOfCycle: dayOfCycle };
  }

  global.Cycle = {
    predict: predict,
    averageCycle: averageCycle,
    classifyDate: classifyDate,
    addDays: addDays,
    daysBetween: daysBetween
  };
})(typeof window !== "undefined" ? window : this);
