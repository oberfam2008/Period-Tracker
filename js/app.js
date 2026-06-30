/* app.js — UI wiring, rendering, the mood-insight engine, and partner tips.
 *
 * Framing: this app helps a partner understand and support the person whose
 * cycle is being tracked. Insights and tips are written in the third person
 * ("she / her") and kept plain and practical.
 */
(function () {
  "use strict";

  var data; // hydrated asynchronously in init() before anything renders

  /* Display name helpers (fall back gracefully when no name is set). */
  function herName() { return data.name ? escapeHtml(data.name) : "She"; }
  function herLower() { return data.name ? escapeHtml(data.name) : "she"; }
  function herPossessive() { return data.name ? escapeHtml(data.name) + "'s" : "her"; }

  /* ---------- Insight engine ---------- */

  /* ---------- Cosmic mood content pools ----------
   * The daily reading is assembled Co-Star style: each "slot" (glance, phase
   * body, sub-stage, moon, sign, balance, throughline, aphorism) is drawn from
   * a pool with a date-seeded RNG. Combined with the dynamic cycle-day detail,
   * the result is effectively non-repeating day to day.
   */
  var PHASE_TITLE = {
    menstrual: "Rest & Recovery",
    follicular: "Rising Energy",
    ovulation: "Peak & Outgoing",
    luteal: "Winding Down"
  };

  // Short, evocative opening line (the "day at a glance"), split so that
  // stage-specific lines only surface in the matching sub-stage. The `any`
  // bucket applies to the whole phase and is merged in at pick time.
  var GLANCE = {
    menstrual: {
      any: [
        "She's running on a lower, quieter frequency today.",
        "Her body is asking for less, not more.",
        "Energy is scarce; tenderness is the currency that counts.",
        "She's turned inward, conserving what she has.",
        "The volume of her world wants turning down today.",
        "Comfort outranks everything else right now.",
        "She's in the rest phase — meet her there, gently.",
        "Small and soft beats big and bright today.",
        "The pull today is toward stillness and warmth.",
        "She's recovering — patience reads as love this week."
      ],
      early: [
        "These first days are the heaviest of the cycle — go easy.",
        "Her reserves are at their lowest right now; don't ask her to spend them.",
        "This is the deepest part of the dip — minimize everything you can."
      ],
      mid: [
        "She's a few days in — steadier than the start, but still low.",
        "The worst may be easing, but comfort still rules the day."
      ],
      late: [
        "Her period's winding down — you may see her start to brighten.",
        "The upswing is just ahead; she's almost back online.",
        "Energy is about to start climbing again — ease her into it."
      ]
    },
    follicular: {
      any: [
        "Something in her is waking back up.",
        "Her energy is on the rise, and so is her openness.",
        "The door is open today — to ideas, to plans, to you.",
        "She's building momentum; lean into it with her.",
        "Fresh starts feel possible to her right now.",
        "Curiosity is back online for her today.",
        "Optimism comes easily to her in this stretch.",
        "She's game — a good day to ask, suggest, invite.",
        "Her appetite for the new is climbing."
      ],
      early: [
        "She's just re-emerging from the quiet — warming back up.",
        "The brightening has only just begun; let her ease into it.",
        "Still finding her feet after her period — gentle momentum."
      ],
      mid: [
        "She's hitting an easy, capable stride today.",
        "Right in the sweet spot — motivated and up for things."
      ],
      late: [
        "She's closing in on her peak — energy and confidence cresting.",
        "Almost at the top of her arc; momentum is strong.",
        "The run-up to ovulation — she's nearly at full brightness."
      ]
    },
    ovulation: {
      any: [
        "She's at the top of her arc today.",
        "This is her most magnetic, open window of the month.",
        "Confidence and warmth are pouring off her.",
        "She's lit up — connection is effortless right now.",
        "Today she's at her most present and alive.",
        "Her social, expressive self is fully switched on.",
        "She's radiating; don't waste the day on logistics.",
        "Closeness comes easily — she's reaching for it too.",
        "This is the brightest the cycle gets — show up for it.",
        "Her energy is generous today; match it.",
        "Everything in her is turned outward and warm."
      ],
      peak: [
        "The peak is here; she feels it and so will you.",
        "This is the day it all crests — make it count."
      ]
    },
    luteal: {
      any: [
        "She's winding down, and the small stuff lands harder.",
        "This is the part of the cycle that needs your steadiness.",
        "The mood can turn quickly now; be the calm constant.",
        "Reassurance goes further than anything else this week.",
        "Feelings sit closer to the surface for her now.",
        "She's conserving again; don't add to the load.",
        "The bright stretch is behind her — comfort is back on the menu.",
        "Her bandwidth is shrinking; protect it."
      ],
      early: [
        "Past her peak but still steady — an easy stretch before the dip.",
        "She likely still feels pretty good; the wind-down is gentle so far.",
        "Early in the descent — energy's dipping slowly, not sharply."
      ],
      mid: [
        "The wind-down is underway; patience is getting shorter.",
        "Energy's dipping now — start easing the load."
      ],
      late: [
        "Tenderness is peaking — the days right before her period are the rawest.",
        "She's most easily worn down right now; buffer her from friction.",
        "This is the PMS window — soften everything you can."
      ]
    }
  };

  // Longer descriptive body for the phase.
  var PHASE_BODY = {
    menstrual: [
      "Her energy is likely at its lowest as her body resets — expect more fatigue, possible cramps, and a pull to retreat. Comfort and quiet are your best tools.",
      "This is the reset point of her cycle. Hormones are at their floor, which usually means low energy and a shorter fuse for hassle.",
      "Her body is doing quiet, demanding work right now. Tiredness and tenderness are normal; ease the day wherever you can.",
      "The first phase asks for rest. She may want less conversation, fewer plans, and more permission to do nothing.",
      "Physically she's depleted and may be uncomfortable. Practical care lands better than grand gestures this week.",
      "She's likely sensitive and low on reserves. A calm, predictable environment does more for her than anything flashy.",
      "Comfort is the whole assignment today — warmth, rest, and being left genuinely off the hook.",
      "Her system is in recovery mode. Expect her to want to cocoon, and make that easy for her."
    ],
    follicular: [
      "Estrogen is climbing and her mood is rising with it. She tends to feel more open, optimistic, and game for new things now.",
      "This is the bright, building stretch. Energy, focus, and sociability are all on the way up.",
      "Her body is gearing up toward ovulation — confidence, creativity, and a willingness to say yes are returning.",
      "The fog of the last phase is lifting. She's re-emerging, with more drive and more patience.",
      "Momentum is the theme. Ideas feel possible to her and her appetite for activity is growing.",
      "She's increasingly outward-facing and receptive — a naturally good window for plans and connection.",
      "Her energy is fresh and rising; she'll likely welcome a little novelty and a change of scene.",
      "This is the upswing of the month — motivation and optimism are both trending up for her."
    ],
    ovulation: [
      "She's likely at her most confident, social, and affectionate. Connection and conversation come easily — the warmest window of the month.",
      "This is the high point of her cycle: energy, mood, and magnetism all peak around now.",
      "Her body is at its most outgoing and open. Expect her at her most expressive, generous, and present.",
      "Everything is turned outward today — she's drawn to people, closeness, and warmth.",
      "Hormonally this is the crest. She's likely feeling her best and most alive.",
      "Her confidence and sociability are peaking; she's reaching for connection, not retreating from it.",
      "This is the most magnetic stretch of the month — she's open and easy to be close to.",
      "Her self-assurance is at its height. Meet her energy and the day takes care of itself."
    ],
    luteal: [
      "Hormones are shifting and her focus turns inward. She may be more sensitive, tired, or easily irritated — patience matters most now.",
      "Past ovulation, her body begins to wind down. Expect a gradual dip in energy and a lower tolerance for friction.",
      "Progesterone is rising, which often brings a quieter, more inward, sometimes touchier mood.",
      "The bright phase is over; she's drawing inward again and the small stuff weighs more.",
      "This is the part of the cycle where reassurance matters. She may feel stretched thin and need you to be steady.",
      "Her bandwidth is shrinking. Pre-empting stress does more good now than fixing a mood after it lands.",
      "Sensitivity climbs through this phase, peaking just before her period. Soften your edges and lighten her load.",
      "She's turning toward comfort and security. Predictable, low-friction days serve her best right now."
    ]
  };

  // Sub-stage nuance (early/mid/late within the phase; ovulation = peak).
  var STAGE_NOTE = {
    menstrual: {
      early: [
        "The first day or two are usually the heaviest — keep expectations low and handle what you can without being asked.",
        "Right at the start, discomfort and tiredness tend to peak; a hands-on, no-questions approach helps most.",
        "These opening days are the most draining of the cycle — make them as easy as possible for her."
      ],
      mid: [
        "She's a few days in now; the worst may be easing but energy is still low.",
        "Mid-period, she may start feeling a little more herself — follow her lead rather than pushing.",
        "The middle of her period is steadier than the start, but comfort still wins the day."
      ],
      late: [
        "Her period is winding down and energy is about to start climbing — you may notice her brightening over the next day or two.",
        "The tail end: a good moment to gently reintroduce light plans as she comes back online.",
        "She's nearly through it; the upswing is just ahead."
      ]
    },
    follicular: {
      early: [
        "Just out of her period, she's re-emerging — a good time to gently float plans and see what sticks.",
        "Energy is freshly returning; she may welcome light activity and a change of scene.",
        "Early follicular is a soft restart — she's warming back up to the world."
      ],
      mid: [
        "She's in the sweet spot of this phase — motivated, capable, and up for things.",
        "Momentum is building nicely; a strong window for plans, projects, and connection.",
        "Mid-follicular, she's likely at an easy, capable cruise."
      ],
      late: [
        "She's approaching ovulation — energy and openness are nearing their peak over the next few days.",
        "The run-up to ovulation: her confidence and drive are cresting.",
        "Late follicular — she's almost at her high point; momentum is strong."
      ]
    },
    ovulation: {
      peak: [
        "This is the day or two it all crests — make the most of it.",
        "Right at the peak: she's likely feeling her best, so meet her there.",
        "Her arc tops out right about now — the warmest, brightest window."
      ]
    },
    luteal: {
      early: [
        "Early luteal is usually still pretty steady — a calm, pleasant stretch before things get more tender.",
        "Just after ovulation she often still feels good; enjoy the easy window while it lasts.",
        "The first part of luteal is gentle — the dip hasn't really set in yet."
      ],
      mid: [
        "Mid-luteal, you may notice energy dipping and patience getting shorter — start easing the load.",
        "Things are turning inward now; pre-empt stress and keep the week manageable.",
        "The wind-down is underway — soften the schedule where you can."
      ],
      late: [
        "These last few days before her period are the classic PMS window — sensitivity and fatigue can spike, so lead with gentleness.",
        "Right before her period, expect the strongest dip; extra patience and comfort go a long way now.",
        "Late luteal is the most tender stretch — be the steady, calm one this week."
      ]
    }
  };

  // Co-Star-style punchy closer, addressed to the partner. Stage-aware so the
  // advice matches where she is in the phase (see GLANCE for the structure).
  var APHORISM = {
    menstrual: {
      any: [
        "Today, doing less for her is doing more.",
        "Care doesn't have to be loud to be felt.",
        "Be the soft place, not another thing to manage.",
        "Comfort is a language; speak it fluently.",
        "Show up quietly and stay.",
        "The right move is the gentle one.",
        "Make her world smaller and warmer today.",
        "Rest is productive. Let her have it.",
        "Hold the space; don't try to fix it.",
        "Your patience is the gift today.",
        "Lower the stakes on everything you can."
      ],
      early: [
        "What she needs today is subtraction, not addition.",
        "Take everything off her plate that you can reach."
      ],
      late: [
        "Let her come back online at her own speed.",
        "Ease her toward the upswing; don't rush it."
      ]
    },
    follicular: {
      any: [
        "Say yes to the thing she's curious about.",
        "Momentum likes company — go with her.",
        "This is a day to build, not to wait.",
        "Match her energy and watch it grow.",
        "Open doors while they're open.",
        "Be a little spontaneous; she's ready for it.",
        "Curiosity is contagious — catch it.",
        "Don't overthink it. Just suggest the thing.",
        "Lean into the upswing with her.",
        "Fresh beats familiar today."
      ],
      early: [
        "Plant something today; it'll take root now.",
        "Gently float a plan and see what she grabs."
      ],
      late: [
        "Her yes is easiest to earn right now — ask.",
        "She's nearly at her peak; aim a little higher."
      ]
    },
    ovulation: {
      any: [
        "Don't spend her best day on small things.",
        "Be present; that's the whole assignment.",
        "Reach for her — she's reaching too.",
        "Make a memory, not a to-do list.",
        "Warmth answered with warmth compounds.",
        "This is the day to choose her out loud.",
        "Put the phone down and look at her.",
        "Say the thing you appreciate — today it lands.",
        "Connection is the easiest it'll be all month.",
        "Show up like it's a date, because it is.",
        "Generosity meets generosity today.",
        "Don't let the peak pass unmarked."
      ],
      peak: [
        "This is the summit — plant the flag together."
      ]
    },
    luteal: {
      any: [
        "Be the calm she can borrow.",
        "Don't take the weather personally.",
        "Steadiness is the kindest thing you can offer now.",
        "Lighten the load before she has to ask.",
        "Choose patience over being right.",
        "Soften your edges; hers are already raw.",
        "Protect her peace today.",
        "Reassurance costs little and means a lot now.",
        "Anticipate, don't react.",
        "Make the day quieter than it wants to be.",
        "Comfort first; everything else can wait."
      ],
      early: [
        "Enjoy the easy stretch — and start lightening the load."
      ],
      late: [
        "Hold steady while she rides it out.",
        "This is the week your patience matters most."
      ]
    }
  };

  var GLANCE_GENERIC = [
    "Here's the cosmic weather for her today.",
    "A read on the day's energy, straight from the Moon.",
    "Today's tone, set by the Moon overhead.",
    "The Moon's setting the mood — here's the gist.",
    "What the day's sky is whispering about her mood.",
    "A quick celestial read for the two of you today.",
    "The Moon's the headline today; here's the forecast.",
    "The sky's mood is worth reading even before her cycle is dialed in."
  ];

  var APHORISM_GENERIC = [
    "Pay attention to her signals; the sky only sketches the outline.",
    "Read the room, then read the stars.",
    "Let the Moon hint, but let her tell you the truth.",
    "The chart suggests; she decides.",
    "Use this as a nudge, not a verdict.",
    "Notice more than you assume today.",
    "The best forecast is still paying attention.",
    "Curiosity beats certainty — with the stars and with her."
  ];

  // Per-moon-phase phrasings.
  var MOON_PHASE_LINES = {
    "New Moon": [
      "tonight's New Moon carries a fresh-start, reset energy",
      "the New Moon leans quiet and inward — a night for low light and small intentions",
      "under the dark New Moon, the mood is private and slow"
    ],
    "Waxing Crescent": [
      "the Waxing Crescent carries gentle, building momentum",
      "a young Moon is gathering — small steps and quiet motivation",
      "the crescent leans hopeful and forward-tilting"
    ],
    "First Quarter": [
      "the First Quarter Moon pushes toward decision and action",
      "this half Moon carries friction and drive in equal measure",
      "the First Quarter leans restless — energy looking for a direction"
    ],
    "Waxing Gibbous": [
      "the Waxing Gibbous carries focus and fine-tuning energy",
      "an almost-full Moon — anticipation and momentum are high",
      "the gibbous Moon leans intense and building"
    ],
    "Full Moon": [
      "tonight's Full Moon turns the emotional volume all the way up",
      "under the Full Moon, feelings run bright and close to the surface",
      "the Full Moon carries heightened intensity — beautiful and a little raw"
    ],
    "Waning Gibbous": [
      "the Waning Gibbous carries reflection and a settling-down energy",
      "just past full, the Moon leans toward gratitude and release",
      "the waning gibbous mood is softer and more contemplative"
    ],
    "Last Quarter": [
      "the Last Quarter Moon is about letting go and clearing space",
      "this half Moon leans toward release and honest reckoning",
      "the Last Quarter carries a turning-inward, tidying energy"
    ],
    "Waning Crescent": [
      "the Waning Crescent leans toward rest, retreat, and recharging",
      "the old Moon is nearly gone — a low, quiet, restorative tone",
      "the waning crescent carries surrender and stillness"
    ]
  };

  /* How the MOON-sign element colors her emotional weather today. */
  var MOON_ELEMENT = {
    Fire:  ["energetic and quick to react", "lively, impatient, and ready for action", "warm but easily sparked"],
    Earth: ["steady and seeking comfort", "grounded, a little stubborn, and comfort-seeking", "practical and slow to be moved"],
    Air:   ["social, talkative, and a little restless", "chatty, curious, and up in her head", "light, mental, and easily distracted"],
    Water: ["tender, intuitive, and emotionally open", "deeply feeling and easily moved", "sensitive, dreamy, and close to her emotions"]
  };

  /* How her SUN-sign element tends to color her temperament. */
  var SUN_ELEMENT = {
    Fire: [
      "As a fire sign, she runs on momentum — when she's restless, a shared activity or a change of scene helps more than sitting still.",
      "Her fire nature craves action and passion; she'd rather do something than talk about it.",
      "Fire signs lead with instinct and drive — give her room to move and a reason to chase."
    ],
    Earth: [
      "As an earth sign, she values dependability — showing up consistently speaks louder than any grand gesture.",
      "Her earth nature craves comfort and stability; small, reliable things mean the most to her.",
      "Earth signs are grounded and practical — steadiness is what makes her feel safe."
    ],
    Air: [
      "As an air sign, she lives in ideas and conversation — a real talk can shift her whole mood.",
      "Her air nature needs mental stimulation and connection; she wants to be heard, not handled.",
      "Air signs think out loud — let her talk it through and she'll find her footing."
    ],
    Water: [
      "As a water sign, she feels first and thinks second — meet the emotion before the logic.",
      "Her water nature runs deep; she needs her feelings acknowledged, not solved.",
      "Water signs are intuitive and tender — lead with empathy and she'll soften."
    ]
  };

  function pickFrom(rng, arr) {
    if (!arr || !arr.length) return "";
    return arr[Math.floor(rng() * arr.length)];
  }

  // Merge a phase's stage-agnostic `any` lines with its current-stage lines so
  // only stage-appropriate phrasings can surface, while keeping good variety.
  function stagePool(map, phaseKey, stage) {
    var m = map[phaseKey] || {};
    return (m.any || []).concat(m[stage] || []);
  }

  // Where she sits within the current phase: early / mid / late (or peak).
  function cycleStage(pred) {
    var ph = pred.phase.key;
    if (ph === "ovulation") return "peak";
    var d = pred.dayOfCycle, P = pred.periodLength, L = pred.cycleLength;
    var ovuDay = L - 13; // day number of ovulation
    var prog;
    if (ph === "menstrual") prog = (d - 1) / Math.max(1, P - 1);
    else if (ph === "follicular") prog = (d - P) / Math.max(1, (ovuDay - 2) - P);
    else prog = (d - (ovuDay + 2)) / Math.max(1, L - (ovuDay + 2));
    if (isNaN(prog)) return "mid";
    if (prog < 0.34) return "early";
    if (prog > 0.66) return "late";
    return "mid";
  }

  // Dynamic, number-driven sentence — changes every day on its own.
  function buildWhere(pred) {
    var day = pred.dayOfCycle;
    var today = Cycle.addDays(pred.cycleStart, day - 1);
    var toOvu = Cycle.daysBetween(today, pred.ovulation);
    var toFertile = Cycle.daysBetween(today, pred.fertileStart);
    var base = "She's on <strong>day " + day + "</strong> of her cycle";
    var clause;
    if (pred.isLate) clause = ", and her period is <strong>" + pred.daysLate + (pred.daysLate === 1 ? " day" : " days") + " late</strong> (expected around " + fmtShort(pred.nextPeriod) + ").";
    else if (pred.isOvulationDay) clause = ", right at ovulation — her peak.";
    else if (pred.isFertile) clause = ", inside her fertile window (through " + fmtShort(pred.fertileEnd) + ").";
    else if (toFertile >= 1 && toFertile <= 5) clause = ", with her fertile window opening in " + toFertile + (toFertile === 1 ? " day" : " days") + ".";
    else if (toOvu >= 1) clause = ", about " + toOvu + (toOvu === 1 ? " day" : " days") + " out from ovulation.";
    else clause = ", with her next period expected in " + pred.daysUntilNext + (pred.daysUntilNext === 1 ? " day" : " days") + " (around " + fmtShort(pred.nextPeriod) + ").";
    return base + clause;
  }

  /* Interpret the blend of her sun element and today's moon element. */
  var BALANCE_SAME = [
    "Her core nature and today's mood are both <strong>{el}</strong> — that energy is doubled, so expect a strong, undiluted dose of it.",
    "With both her sign and the Moon in <strong>{el}</strong>, there's no counterweight today — whatever {el} brings, it brings fully.",
    "Two helpings of <strong>{el}</strong> today: her temperament and her mood point the same direction, amplified."
  ];
  var BALANCE_PAIRS = {
    "Air-Fire": [
      "Fire and Air feed each other — she's expressive, lively, and ready to engage. Match her spark.",
      "Air fans her fire today: quick, talkative, and energized. Keep up rather than slow her down."
    ],
    "Earth-Water": [
      "Earth and Water nourish each other — a grounded, nurturing mood. Cozy, caring gestures land well.",
      "Water softens her earth today: settled, tender, and comfort-seeking. Lean into warmth."
    ],
    "Fire-Water": [
      "Fire meets Water — passion and deep feeling can boil into steam. Emotions may run hot; stay calm and don't take heat personally.",
      "Her fiery drive and watery feelings are at odds today; expect intensity, and be the steady one."
    ],
    "Earth-Fire": [
      "Fire meets Earth — drive versus caution. She may feel torn between acting and staying safe; don't rush her.",
      "Her grounded side and a restless spark are pulling against each other; give her both patience and a little motion."
    ],
    "Air-Earth": [
      "Air meets Earth — restlessness versus routine. Give her a little novelty and a little stability both.",
      "Her practical side and a busy mind are competing today; structure plus a small change of scene helps."
    ],
    "Air-Water": [
      "Air meets Water — thoughts versus feelings. She may want to talk and feel at once; listen first, solve later.",
      "Her heady side and her tender side are both loud today; make room for both without forcing logic."
    ]
  };

  function buildBalance(rng, sunEl, moonEl) {
    if (sunEl === moonEl) {
      return pickFrom(rng, BALANCE_SAME).replace(/\{el\}/g, sunEl);
    }
    var pair = [sunEl, moonEl].sort().join("-");
    return BALANCE_PAIRS[pair]
      ? pickFrom(rng, BALANCE_PAIRS[pair])
      : "Her sun and the Moon mix two different energies today — expect a blend of both.";
  }

  // Throughline: cycle energy direction vs. moon direction.
  var SYNTH = {
    upUp: [
      "Both her cycle and the waxing Moon are building — a naturally upbeat, outgoing stretch. A great time to make plans and lean into connection.",
      "Her rising cycle energy and the growing Moon point the same way: outward and up. Capitalize on it.",
      "Two tailwinds at once — her body and the Moon are both building. Momentum is on your side today.",
      "Cycle and sky agree: this is an expansive, yes-saying day. Use it."
    ],
    downDown: [
      "Her cycle and the waning Moon both invite slowing down — expect a quieter, more inward mood. Comfort and patience go a long way.",
      "Both signals point inward right now. Lower the tempo and let the day be gentle.",
      "Her body and the Moon are both winding down — a day for rest, not push.",
      "Cycle and sky agree on retreat today. Don't fight the current."
    ],
    upDown: [
      "Her body is energized while the Moon winds down — a mixed signal. She may want to do things but tire quickly, so keep plans flexible.",
      "Her cycle says go, the Moon says slow — let her start things but leave room to bail early.",
      "Rising energy against a fading Moon: enthusiasm now, fatigue later. Pace it.",
      "Her drive is up but the day's undertow pulls back — keep ambitions light and flexible."
    ],
    downUp: [
      "Her cycle leans inward while the Moon builds outside — a tender contrast. Don't over-schedule her, and let her set the pace.",
      "Inner quiet, outer buzz: the Moon's pull and her cycle disagree today. Follow her lead.",
      "A gentle tension — the world's energy is up but hers is turning in. Keep it low-key.",
      "The sky says go out, her body says stay in. Let her choose, and protect her quiet."
    ]
  };

  function synthKey(phaseKey, moon) {
    var energyUp = (phaseKey === "follicular" || phaseKey === "ovulation");
    return energyUp ? (moon.waxing ? "upUp" : "upDown") : (moon.waxing ? "downUp" : "downDown");
  }

  // Shared moon paragraph used by both readings.
  function moonParagraph(rng, moon, moonSignObj) {
    return "<p><strong>The Moon &amp; her mood.</strong> At " +
      Math.round(moon.illumination * 100) + "% lit, " +
      pickFrom(rng, MOON_PHASE_LINES[moon.name] || ["the Moon sets a shifting tone"]) +
      ". With the Moon in <strong>" + moonSignObj.name + "</strong> (" + moonSignObj.element +
      "), her emotional weather leans <strong>" +
      pickFrom(rng, MOON_ELEMENT[moonSignObj.element] || ["shifting"]) + "</strong>.</p>";
  }

  /* Full daily reading: assembled from pools, seeded by the calendar day. */
  function buildInsight(pred, moon, sunSign, moonSignObj) {
    var phaseKey = pred.phase.key;
    var rng = makeRng(dailySeed(new Date()) + 101);
    var stage = cycleStage(pred);
    var parts = [];

    parts.push('<p class="lead">' + pickFrom(rng, stagePool(GLANCE, phaseKey, stage)) + "</p>");
    parts.push("<p><strong>Where she is.</strong> " + buildWhere(pred) + "</p>");

    var body = pickFrom(rng, PHASE_BODY[phaseKey]);
    if (data.name) body = body.replace(/^Her\b/, escapeHtml(data.name) + "'s");
    var stageNote = pickFrom(rng, (STAGE_NOTE[phaseKey] || {})[stage] || []);
    parts.push("<p><strong>" + PHASE_TITLE[phaseKey] + ".</strong> " + body +
      (stageNote ? " " + stageNote : "") + "</p>");

    parts.push(moonParagraph(rng, moon, moonSignObj));

    if (sunSign) {
      parts.push("<p><strong>Her sign.</strong> " + pickFrom(rng, SUN_ELEMENT[sunSign.element]) + "</p>");
      parts.push("<p><strong>The balance.</strong> " + buildBalance(rng, sunSign.element, moonSignObj.element) + "</p>");
    } else {
      parts.push('<p class="muted"><strong>Tip:</strong> Add her birthday in Settings to unlock ' +
        "her sun sign and a personalized element-balance reading.</p>");
    }

    parts.push("<p><strong>The throughline.</strong> " + pickFrom(rng, SYNTH[synthKey(phaseKey, moon)]) + "</p>");
    parts.push('<p class="aphorism">' + pickFrom(rng, stagePool(APHORISM, phaseKey, stage)) + "</p>");
    return parts.join("");
  }

  /* ---------- Practical partner tips ---------- */

  var PHASE_TIPS = {
    menstrual: {
      good: [
        "🍜 Bring home takeout or her comfort food — cooking is the last thing she wants tonight.",
        "🛋️ Set up a cozy night in: heating pad, blanket, her favorite show.",
        "🧹 Quietly handle a chore or two without being asked.",
        "😴 Protect her sleep — take the early alarm, the kids, or the dog.",
        "☕ Bring her a warm drink and her painkillers without being asked.",
        "🛁 Run her a bath or hand her the evening completely off.",
        "🍫 Pick up chocolate or whatever she craves on the way home.",
        "📺 Suggest a low-effort night in over any obligation.",
        "🤫 Keep the house calm — handle the noise and the logistics.",
        "🌡️ Restock the essentials: pads/tampons, ibuprofen, her go-to snacks.",
        "🧦 Little comforts: warm socks, a fresh water bottle, dim lights.",
        "💬 A simple \"what would help right now?\" beats guessing.",
        "🚗 Offer to run the errands she'd normally handle.",
        "🤲 Offer a back or foot rub, no strings attached.",
        "🍲 Make or order something warm and easy for dinner.",
        "📱 Handle the texts and plans so she manages nothing today."
      ],
      hold: [
        "📅 Don't push big decisions or pack the weekend with plans.",
        "🙊 Skip criticism or \"why didn't you…\" questions today.",
        "🎉 This isn't the week for a packed social calendar.",
        "🏋️ Don't nudge her toward anything strenuous.",
        "🧾 Hold off on chore reminders or to-do lists.",
        "⏰ Avoid early starts or rushing her out the door.",
        "🌶️ Don't take low energy or short answers personally.",
        "🗣️ Don't try to fix her mood — just make space for it.",
        "💼 Postpone heavy or stressful conversations if you can.",
        "🍻 Skip the late night out that'll leave her drained."
      ]
    },
    follicular: {
      good: [
        "✨ Suggest a date or try something new together — her energy is climbing.",
        "💬 Good window to talk through plans or decisions; she's more open now.",
        "🚗 Be a little spontaneous — she's up for an adventure.",
        "🏃 Invite her to something active — a walk, a class, a hike.",
        "📝 Bring up that idea or project you've been sitting on.",
        "🍽️ Book the reservation; she'll be game.",
        "🎟️ Plan something a week or two out — she'll enjoy the anticipation.",
        "🤝 Start a new shared habit now; it'll stick better.",
        "😄 Keep it playful and flirty — she's receptive.",
        "🧭 Try a new spot — a café, trail, or neighborhood you haven't explored.",
        "🎨 Do something creative together; her motivation is up.",
        "📸 Make a small plan worth remembering.",
        "🙌 Encourage that goal she's been eyeing — she has momentum.",
        "🍳 Cook something new together rather than ordering in.",
        "👫 Say yes to seeing friends; she's sociable.",
        "🗓️ Lock in a future trip or event you'll both look forward to."
      ],
      hold: [
        "🐢 Don't assume she still wants last week's quiet routine.",
        "🛑 Don't smother the momentum with too much structure.",
        "📉 Don't bury the mood in heavy logistics.",
        "🤐 Don't forget to actually listen when she shares ideas.",
        "🔁 Don't default to the same old plan — she wants a little fresh.",
        "⏳ Don't sit on plans — strike while her energy's up.",
        "📵 Don't let screens eat the evening you could spend together.",
        "🙄 Don't dismiss a new idea just because it's unfamiliar.",
        "😴 Don't over-schedule her to the point of burning out early."
      ]
    },
    ovulation: {
      good: [
        "💃 Plan a date night — she's feeling her most confident and social.",
        "💕 Compliments and affection really land today.",
        "🌟 A great time for a deeper conversation or making plans together.",
        "🥂 Make tonight feel a little special, even simply.",
        "📸 Do something memorable together.",
        "🗣️ Tell her specifically what you love about her.",
        "🌹 A small romantic gesture goes a long way right now.",
        "🍷 Linger over dinner; she's in a connecting mood.",
        "👫 Say yes to seeing friends — she'll shine.",
        "💋 Be physically affectionate; she's most receptive now.",
        "🎶 Put on music, dance in the kitchen, keep it light and warm.",
        "🌆 Get out together — she's drawn to people and energy.",
        "🤍 Really listen; connection matters more than fixing anything.",
        "📷 Capture the moment — a photo, a note, something to keep.",
        "🥰 Initiate closeness and let her know she's wanted.",
        "🍓 Plan a treat or experience she'll love."
      ],
      hold: [
        "⏳ Don't let the day slip by without some quality time.",
        "📱 Don't be glued to your phone tonight.",
        "🥱 Don't waste her best mood on chores and errands.",
        "🙅 Don't pick this moment to raise a grievance.",
        "🤖 Don't keep it all logistics — be present.",
        "🚪 Don't disappear into work all evening.",
        "😐 Don't be lukewarm; meet her warmth with warmth.",
        "🗓️ Don't double-book the night with obligations.",
        "🧊 Don't let a small annoyance cool the mood."
      ]
    },
    luteal: {
      good: [
        "🍫 Stock up on her favorite snacks and treats.",
        "🤗 Lead with patience and reassurance — a little goes a long way.",
        "🧺 Lighten her load: handle dishes, errands, or dinner.",
        "🕯️ A cozy night in beats a big night out right now.",
        "🛋️ Take something off her plate before she has to ask.",
        "☕ Small comforts — her drink, her blanket, her show.",
        "🚿 Give her some uninterrupted time to herself.",
        "🧠 Don't take moodiness personally; stay steady.",
        "🌙 Keep the evening calm and predictable.",
        "💬 Check in gently: \"what would help right now?\"",
        "🛁 Encourage her to unwind — a bath, a walk, an early night.",
        "🍵 Have her comfort snacks and a warm drink ready.",
        "🤲 Offer a back rub or just quiet company.",
        "📵 Shield her from extra obligations and noise.",
        "🧹 Pre-empt the stressors — tidy up, handle the small stuff.",
        "🫶 Reassure her you're on her team, whatever the mood."
      ],
      hold: [
        "💸 Today may not be the day to bring up money or big plans.",
        "🤐 Steer clear of criticism or other sensitive topics.",
        "📵 Don't overcommit her to social events.",
        "🗣️ Don't try to 'fix' her feelings — just acknowledge them.",
        "⏰ Don't add pressure or tight deadlines.",
        "🍷 Go easy on plans that run late and drain her.",
        "🔥 Don't match her irritability — be the calm one.",
        "🧾 Don't pile on chores or to-do reminders.",
        "😤 Don't escalate a small disagreement.",
        "🎢 Don't spring surprises or last-minute changes."
      ]
    }
  };

  var ELEMENT_TIP = {
    Fire:  "🔥 She may want to move — offer a walk, a drive, or getting out of the house.",
    Earth: "🌿 Small comforts and reliability matter most to her today.",
    Air:   "💭 She'll appreciate being heard — ask how she's doing and really listen.",
    Water: "💧 Lead with empathy; acknowledge her feelings before jumping to solutions."
  };

  // Seeded RNG (mulberry32) — deterministic per seed, so a given day always
  // produces the same picks but consecutive days differ.
  function makeRng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Pick n distinct items from arr using rng (no repeats within a day).
  function sampleFrom(rng, arr, n) {
    var copy = arr.slice(), out = [];
    n = Math.min(n, copy.length);
    for (var i = 0; i < n; i++) {
      out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
    }
    return out;
  }

  // Distinct per-phase seed offsets so phases don't rotate in lockstep.
  var TIP_SEED = { menstrual: 11, follicular: 23, ovulation: 37, luteal: 53 };

  function buildTips(phase, moon, sunSign) {
    var t = PHASE_TIPS[phase.key];
    // Seed from the calendar day so the set is stable today and fresh tomorrow.
    var rng = makeRng(dailySeed(new Date()) + (TIP_SEED[phase.key] || 0));
    var good = sampleFrom(rng, t.good, 4);
    var hold = sampleFrom(rng, t.hold, 3);

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

  /* ---------- Intimacy outlook ----------
   * Desire and adventurousness tend to rise toward ovulation and ease off in
   * the luteal phase. These are general patterns, not rules — the card always
   * reminds the partner to read her cues and communicate.
   */
  var INTIMACY = {
    menstrual: {
      desire: 2, adventure: 2, verdict: "amber",
      headline: "Let her lead — keep it gentle",
      tip: "Closeness and affection may be more welcome than sex itself this week. Offer cuddles, a back rub, and zero pressure. If she's in the mood, keep it gentle and comforting."
    },
    follicular: {
      desire: 4, adventure: 3, verdict: "green",
      headline: "Warming up — and getting better",
      tip: "Her playful, flirty side is waking up along with her energy. Build a little anticipation through the day — a flirty text, a planned night in. She's increasingly open to initiating."
    },
    ovulation: {
      desire: 5, adventure: 5, verdict: "green",
      headline: "Green light — her peak",
      tip: "If you're going to plan a special night, this is the window. Desire, confidence, and openness are all at their highest — the most likely time she'll initiate and the best time to be adventurous together."
    },
    luteal_early: {
      desire: 3, adventure: 3, verdict: "amber",
      headline: "Still warm — read the room",
      tip: "A relaxed, connected evening can absolutely set the mood, but watch her signals. Romantic and unhurried beats high-pressure right now."
    },
    luteal_late: {
      desire: 2, adventure: 2, verdict: "amber",
      headline: "Comfort over passion",
      tip: "She may want reassurance and closeness more than sex in the days before her period — and a \"not tonight\" isn't about you. Slow, affectionate, low-key; let intimacy grow out of comfort."
    }
  };

  var DESIRE_WORDS = ["", "Very low", "Low", "Moderate", "High", "Peak"];
  var ADVENTURE_WORDS = ["", "Reserved", "Mellow", "Open", "Playful", "Adventurous"];

  /* Suggested position, keyed by the day's adventurousness (1-5). Tasteful,
   * mainstream options; phase adds a comfort overlay on tender days. */
  var POSITIONS = {
    1: [
      { emoji: "🥄", name: "Spooning", note: "side-by-side and gentle, with lots of skin-to-skin closeness — easy on low energy." },
      { emoji: "🤍", name: "Lazy side-by-side", note: "slow, relaxed, and intimate without much effort." },
      { emoji: "🫶", name: "Chest-to-chest, barely moving", note: "lie close and still — connection over motion." },
      { emoji: "😴", name: "Spooning with a pillow between knees", note: "extra-comfy and supported for tender days." },
      { emoji: "🌙", name: "Side-by-side, facing, legs intertwined", note: "tangled up and quiet, easy on the body." },
      { emoji: "🛌", name: "Her on her side, you nestled behind", note: "minimal effort, maximum closeness." },
      { emoji: "💤", name: "Slow 'soaking' (stay connected, hardly move)", note: "calm and unhurried — just be together." },
      { emoji: "🕯️", name: "Cuddled half-on-top of you", note: "she sets all the pace; you stay still and warm." },
      { emoji: "💗", name: "Her resting on your chest", note: "you on your back, her lying along you — cozy and slow." },
      { emoji: "🤲", name: "Foreheads touching, face-to-face", note: "eye contact and breath, almost no movement." },
      { emoji: "🧣", name: "Fully wrapped-up gentle missionary", note: "arms and legs around each other, slow and warm." },
      { emoji: "🌊", name: "Her on top, lying flat and still", note: "she stays draped over you and barely moves." },
      { emoji: "🤝", name: "Side spoon with slow hand-holding", note: "tender and unhurried, hands linked." },
      { emoji: "🐚", name: "Fetal spoon (knees tucked)", note: "the snuggest, most protective spoon." },
      { emoji: "☕", name: "Slow half-asleep morning spoon", note: "drowsy, gentle, and low-pressure." },
      { emoji: "🛋️", name: "Under-the-blanket full-body hug", note: "warmth and closeness first, motion optional." },
      { emoji: "👅", name: "Slow oral for her", note: "she lies back and relaxes while you take your time — easy on her energy." },
      { emoji: "🤍", name: "Gentle oral for him, lying close", note: "unhurried and intimate, with no pressure." },
      { emoji: "💋", name: "Kisses that drift into gentle oral", note: "a tender, slow build-up while staying close." },
      { emoji: "🫦", name: "Side-by-side, relaxed oral", note: "cozy and low-effort for a quiet day." }
    ],
    2: [
      { emoji: "💏", name: "Missionary, pillow under her hips", note: "face-to-face and connected — relaxed but a little more engaged." },
      { emoji: "🫂", name: "Coital alignment (slow grinding)", note: "close and rhythmic, with the emphasis on connection." },
      { emoji: "🤍", name: "Missionary, her legs together", note: "snug and gentle, with a slower rhythm." },
      { emoji: "🦋", name: "Her on her back, knees drawn up", note: "easy, comfortable, and intimate." },
      { emoji: "↔️", name: "Side entry (her on her back, you on your side)", note: "relaxed angle, lots of eye contact." },
      { emoji: "🛏️", name: "Her at the edge of the bed, you kneeling", note: "comfortable for her, easy to stay close." },
      { emoji: "🧘", name: "Seated hug (you cross-legged, her on your lap)", note: "wrapped together, slow and connected." },
      { emoji: "💞", name: "Side-by-side, then roll into missionary", note: "ease in gently, then deepen the connection." },
      { emoji: "🦶", name: "Missionary, ankles resting on your chest", note: "a gentle deeper angle without much effort." },
      { emoji: "🌸", name: "Her on her back, one leg raised", note: "a small change of angle, still relaxed." },
      { emoji: "🪶", name: "You on your back, her lying on top facing you", note: "close and calm, she controls the pace." },
      { emoji: "💫", name: "Edge of bed, her reclined on her elbows", note: "comfortable and unhurried, easy eye contact." },
      { emoji: "🪑", name: "Seated on a chair, her facing you (slow)", note: "intimate and interactive without much exertion." },
      { emoji: "🍂", name: "Her on her stomach, pillow under hips", note: "relaxed and gentle, a soft from-behind angle." },
      { emoji: "➕", name: "Cross-bodied (perpendicular) side angle", note: "a low-key new geometry to keep it interesting." },
      { emoji: "🌅", name: "Slow build from kissing into missionary", note: "lots of warm-up, then settle in close." },
      { emoji: "👅", name: "Oral for her, you settled between her legs", note: "she stays comfortable on her back while you focus on her." },
      { emoji: "🍑", name: "Reclined oral for him", note: "she's relaxed and sets an easy pace." },
      { emoji: "💞", name: "Warm up with oral before slow sex", note: "build the mood, then ease into closeness." },
      { emoji: "🪶", name: "Her at the bed's edge, you kneeling (oral)", note: "comfortable for her, attentive and connected." }
    ],
    3: [
      { emoji: "🤠", name: "Her on top", note: "lets her set the pace and depth — great when she's feeling in control." },
      { emoji: "🔄", name: "Side-by-side, facing", note: "balanced and mutual, with easy eye contact." },
      { emoji: "💃", name: "Cowgirl, leaning onto your chest", note: "close and rhythmic while she steers." },
      { emoji: "🪑", name: "You seated, her straddling and facing you", note: "intimate and interactive, easy to kiss." },
      { emoji: "🌊", name: "Her on top, leaning back", note: "a new angle while she stays in charge." },
      { emoji: "🤝", name: "Kneeling, facing each other", note: "mutual effort, holding onto each other." },
      { emoji: "🛋️", name: "On the edge of the couch, her on top", note: "a change of scenery, still relaxed." },
      { emoji: "🌀", name: "Deep spoon (knees forward)", note: "spooning with a deeper, more active angle." },
      { emoji: "🪷", name: "Lotus (you seated, her wrapped around you)", note: "deeply connected, rocking together." },
      { emoji: "🤸", name: "Her on top, feet planted (squat-ride)", note: "she controls depth and tempo fully." },
      { emoji: "🛏️", name: "You sitting on the bed edge, her riding facing you", note: "upright, close, and interactive." },
      { emoji: "🧶", name: "Side-by-side, top leg hooked over you", note: "relaxed but more active than a basic spoon." },
      { emoji: "🔭", name: "Her on top facing away, leaning back onto you", note: "a playful new view while you support her." },
      { emoji: "🙆", name: "Kneeling behind, both upright and close", note: "chest-to-back, slow and connected." },
      { emoji: "💑", name: "Slow standing sway against the bed", note: "gentle and intimate, gradually building." },
      { emoji: "🎚️", name: "Start in missionary, roll into her on top", note: "trade who leads partway through." },
      { emoji: "🔄", name: "Take turns — oral back and forth", note: "trade focus and stay connected throughout." },
      { emoji: "🤝", name: "Side-by-side oral cuddle", note: "relaxed, mutual attention while facing each other." },
      { emoji: "🪑", name: "She sits, you kneel for oral, then she leads", note: "interactive, flowing naturally into her on top." },
      { emoji: "🌊", name: "Oral for her, then she climbs on top", note: "a natural build into her taking the pace." }
    ],
    4: [
      { emoji: "🐶", name: "From behind", note: "more energetic and playful — matches a livelier mood." },
      { emoji: "🪑", name: "Seated, her on your lap (facing away)", note: "playful and close, with easy changes of rhythm." },
      { emoji: "🦵", name: "Her at the edge of the bed, legs on your shoulders", note: "bolder angle while she's comfortable." },
      { emoji: "⬇️", name: "From behind, chest down", note: "a deeper, more intense variation of doggy." },
      { emoji: "🧍", name: "Standing, her bent over the bed", note: "energetic and a little daring." },
      { emoji: "🔁", name: "Reverse cowgirl", note: "she's in control with a playful new view." },
      { emoji: "🍳", name: "Against the kitchen counter", note: "spontaneous — break out of the bedroom." },
      { emoji: "🎢", name: "Switch positions mid-way", note: "keep it playful by moving through two or three." },
      { emoji: "💇", name: "From behind, a hand in her hair / on her hips", note: "playful and a touch assertive, if she likes that." },
      { emoji: "🔂", name: "Reverse cowgirl, leaning forward", note: "a deeper, livelier twist on reverse." },
      { emoji: "🤗", name: "You standing at the bed edge, her legs wrapped around you", note: "close, active, and a little athletic." },
      { emoji: "📐", name: "Prone with hips raised", note: "a deep, energetic from-behind angle." },
      { emoji: "🪟", name: "Her kneeling on a chair, you behind", note: "a change of furniture and a fun angle." },
      { emoji: "🌶️", name: "Spooning that builds into a faster pace", note: "start cozy, then ramp it up." },
      { emoji: "🪞", name: "Bent over the dresser, mirror in view", note: "playful and a bit daring with a view." },
      { emoji: "🎶", name: "Slow dance that turns into standing sex", note: "build the mood, then let it escalate." },
      { emoji: "↕️", name: "69, side-by-side", note: "playful, mutual, and energetic." },
      { emoji: "👑", name: "Face-sitting — she's on top", note: "she's in control; bold but comfortable for her." },
      { emoji: "🧎", name: "Oral with her standing, you kneeling", note: "a fun, daring change of position." },
      { emoji: "🎢", name: "Oral warm-up, then switch it up", note: "tease first, then move into something livelier." }
    ],
    5: [
      { emoji: "🌉", name: "The bridge", note: "adventurous and bold — lean into her peak energy." },
      { emoji: "🚪", name: "Standing, or somewhere new in the house", note: "spontaneous and daring — perfect for an adventurous day." },
      { emoji: "🔥", name: "Try something new together", note: "she's at her most open — a great day to explore a fantasy or a new spot." },
      { emoji: "🚿", name: "In the shower", note: "warm, slippery, and a change of setting." },
      { emoji: "🧱", name: "Up against the wall", note: "passionate and spontaneous if you're both game." },
      { emoji: "🎭", name: "A little role-play or a planned scene", note: "set the stage and lean into her boldness." },
      { emoji: "🪢", name: "Add a new element (toy, blindfold, etc.)", note: "she's most receptive now — a great time to explore together." },
      { emoji: "🛞", name: "The wheelbarrow", note: "athletic and adventurous — only if you're both up for it." },
      { emoji: "🌶️", name: "Revisit a favorite from your logs, turned up", note: "take something you both loved and make it bigger." },
      { emoji: "💪", name: "Standing carry, face-to-face", note: "bold and athletic — lift and hold if you're able." },
      { emoji: "🪞", name: "Mirror play — watch together", note: "a thrilling visual to share on a daring day." },
      { emoji: "⛓️", name: "Light restraint / hands held above (if you're both into it)", note: "a touch of playful control, fully consensual." },
      { emoji: "🌳", name: "Somewhere private and thrilling", note: "a daring change of scene, mindful of privacy." },
      { emoji: "🧊", name: "Sensory play (ice, feathers, temperature)", note: "tease the senses to amp up the adventure." },
      { emoji: "📆", name: "A planned 'date' with a build-up all day", note: "tease and anticipate, then go all out tonight." },
      { emoji: "🔀", name: "Swap who's in control, taking turns leading", note: "trade the lead back and forth for a playful power game." },
      { emoji: "↕️", name: "69 with her on top", note: "an adventurous, fully-mutual twist." },
      { emoji: "👑", name: "Face-sitting with hands held / light control", note: "bold and playful if you're both into it." },
      { emoji: "⏳", name: "Oral edging — build up and pause", note: "tease to the brink and back for an intense build-up." },
      { emoji: "🚿", name: "Oral in a new setting (shower, etc.)", note: "daring and spontaneous — change the scene." }
    ]
  };

  function dailySeed(date) {
    var s = toIso(date), h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  function suggestPosition(adventure, stageKey, date) {
    var tier = Math.max(1, Math.min(5, adventure));
    var list = POSITIONS[tier];
    var pick = list[dailySeed(date) % list.length];
    var comfort = (stageKey === "menstrual" || stageKey === "luteal_late")
      ? " Keep it gentle and let her steer — comfort comes first today."
      : "";
    return '<div class="position-block"><h3>🛏️ Position idea for today</h3>' +
      '<p><span class="pos-emoji">' + pick.emoji + "</span> <strong>" + pick.name + "</strong> — " +
      pick.note + comfort + "</p>" +
      '<p class="muted">Just a playful suggestion tuned to the day\'s mood — never a script. Follow what you\'re both into.</p>' +
    "</div>";
  }

  function intimacyStage(pred) {
    if (pred.phase.key !== "luteal") return pred.phase.key;
    return (pred.daysUntilNext <= 4) ? "luteal_late" : "luteal_early";
  }

  function meter(filled, icon) {
    var out = "";
    for (var i = 1; i <= 5; i++) {
      out += '<span class="pip' + (i <= filled ? "" : " pip-dim") + '">' + icon + "</span>";
    }
    return '<span class="meter">' + out + "</span>";
  }

  var INITIATOR_TEXT = {
    her: "she usually makes the first move",
    him: "you're usually the one to initiate",
    mutual: "it's usually mutual"
  };

  function clamp5(n) { return Math.max(1, Math.min(5, n)); }

  function buildIntimacy(pred, moon, learned, notesForStage, showPositions) {
    var key = intimacyStage(pred);
    var info = INTIMACY[key];

    // Start from the model, then blend in observed data (weighted by sample size).
    var desire = info.desire;
    var adventure = info.adventure;
    var verdict = info.verdict;
    var learnedBlock = "";

    if (learned && learned.count >= 2) {
      var w = learned.count / (learned.count + 2); // more logs -> trust data more
      desire = clamp5(Math.round(info.desire * (1 - w) + learned.avgDesire * w));
      adventure = clamp5(Math.round(info.adventure * (1 - w) + learned.avgAdventure * w));
      verdict = desire >= 4 ? "green" : "amber";

      learnedBlock = '<div class="learned-note">📈 <strong>Refined from your logs.</strong> ' +
        "Across <strong>" + learned.count + "</strong> encounter" + (learned.count === 1 ? "" : "s") +
        " in this phase, " + INITIATOR_TEXT[learned.initiator] +
        " (avg desire " + learned.avgDesire.toFixed(1) + ", adventure " +
        learned.avgAdventure.toFixed(1) + ").</div>";
    } else {
      var have = learned ? learned.count : 0;
      learnedBlock = '<div class="learned-note muted">📈 Log ' +
        (have === 1 ? "a few more encounters" : "encounters") +
        " in this phase (in the Journal tab) and this outlook will tune itself to her real patterns.</div>";
    }

    var moonNote = "";
    if (moon.name === "Full Moon") {
      moonNote = "<p class=\"muted\">🌕 Full moon: intensity and emotions run high tonight — passion can spike, but so can sensitivity.</p>";
    } else if (moon.name === "New Moon") {
      moonNote = "<p class=\"muted\">🌑 New moon: a quieter, more intimate energy — connection over fireworks.</p>";
    }

    var notesNote = "";
    var kws = Learn.topKeywords(notesForStage, 3);
    if (kws.length) {
      notesNote = '<p class="muted">📝 Your notes for this phase often mention: <strong>' +
        kws.join(", ") + "</strong>.</p>";
    }

    return '<div class="intimacy-verdict intimacy-' + verdict + '">' +
        "<strong>" + info.headline + "</strong>" +
      "</div>" +
      '<div class="intimacy-meters">' +
        '<div class="im-row"><span class="im-label">Likely desire</span>' +
          meter(desire, "🔥") +
          '<span class="im-word">' + DESIRE_WORDS[desire] + "</span></div>" +
        '<div class="im-row"><span class="im-label">Adventurousness</span>' +
          meter(adventure, "🌶️") +
          '<span class="im-word">' + ADVENTURE_WORDS[adventure] + "</span></div>" +
      "</div>" +
      "<p>" + info.tip + "</p>" +
      learnedBlock +
      notesNote +
      moonNote +
      (showPositions ? suggestPosition(adventure, key, new Date()) : "") +
      '<p class="muted im-note">A general guide based on her cycle and your logs — every person is different. Always read her cues and communicate; consent and how she feels in the moment come first.</p>';
  }

  /* ---------- Rendering helpers ---------- */

  function fmt(date) {
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }
  function fmtShort(date) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  /* ---------- Daily tab ---------- */

  /* ---------- Reminders / notifications ----------
   * Web notifications fire when the app is open/loaded (no backend push). The
   * Capacitor build can swap in @capacitor/local-notifications for true
   * scheduled alerts. Each reminder fires at most once per day (deduped).
   */
  function notify(body, tag) {
    try {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      var opts = { body: body, tag: tag, icon: "icons/icon.svg", badge: "icons/icon.svg" };
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready
          .then(function (reg) { reg.showNotification("HerRhythm", opts); })
          .catch(function () { try { new Notification("HerRhythm", opts); } catch (e) {} });
      } else {
        new Notification("HerRhythm", opts);
      }
    } catch (e) {}
  }

  function dueReminders(pred, today) {
    var out = [];
    if (!pred.hasData) return out;
    var r = data.reminders || {};
    var nm = data.name || "She";
    var poss = data.name ? data.name + "’s" : "Her";

    if (r.period) {
      if (pred.isLate) out.push({ key: "period-late", body: poss + " period is " + pred.daysLate + " day" + (pred.daysLate === 1 ? "" : "s") + " late." });
      else if (pred.daysUntilNext === 0) out.push({ key: "period-today", body: poss + " period may start today." });
      else if (pred.daysUntilNext === 1) out.push({ key: "period-tomorrow", body: poss + " period is likely to start tomorrow." });
    }
    if (r.ovulation) {
      if (pred.isOvulationDay) out.push({ key: "ovulation", body: "Ovulation today — a great day for a real date." });
      else if (Cycle.daysBetween(today, pred.fertileStart) === 0) out.push({ key: "fertile-open", body: poss + " fertile window opens today." });
    }
    if (r.pms && !pred.isLate && pred.daysUntilNext === 3) {
      out.push({ key: "pms", body: "Heads-up: PMS window ahead — lead with patience this week." });
    }
    if (r.phase) {
      var ovuDay = pred.cycleLength - 13;
      if (pred.dayOfCycle === pred.periodLength + 1) out.push({ key: "phase-follicular", body: nm + " is heading into her higher-energy stretch." });
      else if (pred.dayOfCycle === ovuDay + 2) out.push({ key: "phase-luteal", body: nm + " is entering the wind-down phase — patience helps." });
    }
    return out;
  }

  function runReminders(pred, today) {
    if (!data.reminders || !data.reminders.enabled) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    var todayIso = toIso(today);
    if (!data.lastNotified) data.lastNotified = {};
    var fired = false;
    dueReminders(pred, today).forEach(function (d) {
      if (data.lastNotified[d.key] === todayIso) return;
      notify(d.body, d.key);
      data.lastNotified[d.key] = todayIso;
      fired = true;
    });
    if (fired) Store.save(data);
  }

  function renderDaily() {
    var container = document.getElementById("daily-content");
    var today = new Date();
    var moon = Astro.moonPhase(today);
    var moonSignObj = Astro.moonSign(today);
    var sunSign = data.birthday ? Astro.sunSign(new Date(data.birthday + "T00:00:00")) : null;
    var pred = Cycle.predict(data.periods, data, today);
    runReminders(pred, today);

    var html = backupNudgeHtml();
    var title = data.name ? escapeHtml(data.name) + "'s day 🌙" : "Today 🌙";

    if (pred.hasData) {
      var nextLine = pred.isLate
        ? "Period " + pred.daysLate + " day" + (pred.daysLate === 1 ? "" : "s") + " late"
        : (pred.daysUntilNext === 0 ? "Period expected today"
            : "Next period in " + pred.daysUntilNext + " day" + (pred.daysUntilNext === 1 ? "" : "s"));
      var marker = pred.isOvulationDay ? " • Ovulation today 🌟"
            : pred.isFertile ? " • Fertile window 💧" : "";
      // Feedback-loop prompt: near/over the expected date, ask him to confirm.
      var confirmPrompt = (pred.isLate || pred.daysUntilNext <= 1)
        ? '<div class="confirm-row">' +
            "<span>" + (pred.isLate ? "Has her period started?" : "Period due soon — started yet?") + "</span>" +
            '<button id="confirm-period" class="btn">Yes — log it today</button>' +
          "</div>"
        : "";
      var staleNote = pred.stale
        ? '<div class="muted" style="margin-top:6px">This looks out of date — log her most recent period to refresh predictions.</div>'
        : "";
      html += '<div class="card hero' + (pred.isLate ? " hero-late" : "") + '">' +
        '<div class="muted">' + title + " — " + fmt(today) + "</div>" +
        '<div class="muted">Cycle day</div>' +
        '<div class="cycle-day">' + pred.dayOfCycle + "</div>" +
        '<span class="phase-badge phase-' + pred.phase.key + '">' + pred.phase.label + " phase</span>" +
        '<div class="muted" style="margin-top:10px">' + nextLine + marker + "</div>" +
        staleNote +
        confirmPrompt +
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
      html += buildInsight(pred, moon, sunSign, moonSignObj);
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

    // Intimacy outlook (cycle-driven; optional via settings)
    if (data.showIntimacy !== false) {
      if (pred.hasData) {
        var learned = Learn.analyze(data);
        var stageKey = intimacyStage(pred);
        html += '<div class="card intimacy"><h2>💞 Intimacy outlook</h2>' +
          buildIntimacy(pred, moon, learned.encounters[stageKey], learned.notes[stageKey], data.showPositions !== false) +
        "</div>";
      } else {
        html += '<div class="card intimacy"><h2>💞 Intimacy outlook</h2>' +
          '<p class="muted">Log her period in the History tab to unlock the intimacy outlook — ' +
          "desire and adventurousness track the cycle, so it needs a cycle day to work.</p>" +
        "</div>";
      }
    }

    container.innerHTML = html;
    wireBackupNudge();
    var confirmBtn = document.getElementById("confirm-period");
    if (confirmBtn) confirmBtn.addEventListener("click", function () {
      var iso = toIso(new Date());
      if (data.periods.indexOf(iso) === -1) data.periods.push(iso);
      Store.save(data);
      renderDaily();
      renderHistory();
    });
  }

  /* Cosmic reading when no cycle data is logged yet (moon + sign only). */
  function buildCosmicOnly(moon, sunSign, moonSignObj) {
    var rng = makeRng(dailySeed(new Date()) + 202);
    var parts = [];
    parts.push('<p class="lead">' + pickFrom(rng, GLANCE_GENERIC) + "</p>");
    parts.push(moonParagraph(rng, moon, moonSignObj));
    if (sunSign) {
      parts.push("<p><strong>Her sign.</strong> " + pickFrom(rng, SUN_ELEMENT[sunSign.element]) + "</p>");
      parts.push("<p><strong>The balance.</strong> " + buildBalance(rng, sunSign.element, moonSignObj.element) + "</p>");
    } else {
      parts.push('<p class="muted"><strong>Tip:</strong> Add her birthday in Settings for her sun sign ' +
        "and a personalized element-balance reading. Log a period in History to add cycle-phase insights too.</p>");
    }
    parts.push('<p class="aphorism">' + pickFrom(rng, APHORISM_GENERIC) + "</p>");
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
    var cycleNote = pred.cycleSource === "history" ? "from her logs" : "default";
    var periodNote = pred.periodSource === "history" ? "from her logs" : "default";
    var nextBadge = pred.isLate ? pred.daysLate + "d late" : pred.daysUntilNext + "d";
    var range = (pred.cycleSource === "history" && pred.spread > 0) ? "±" + pred.spread + "d" : "";
    var regNote = (pred.regularity && pred.regularity !== "unknown" && pred.regularity !== "building")
      ? " Her cycles are <strong>" + pred.regularity + "</strong>" + (pred.spread ? " (±" + pred.spread + " days)" : "") + "."
      : (pred.cycleSource === "history" ? " Log a few cycles to gauge how regular she is." : "");

    container.innerHTML =
      '<div class="card">' +
        "<h2>Predictions</h2>" +
        '<div class="pred-grid">' +
          predTile("dot-period", "Next period", fmtShort(pred.nextPeriod), nextBadge) +
          predTile("dot-ovulation", "Ovulation", fmtShort(pred.ovulation), range ? range : "") +
          predTile("dot-fertile", "Fertile window", fmtShort(pred.fertileStart) + "–" + fmtShort(pred.fertileEnd), "") +
        "</div>" +
        '<p class="muted" style="margin-top:14px">Average cycle: <strong>' + pred.cycleLength +
          " days</strong> (" + cycleNote + ") · Average period: <strong>" + pred.periodLength +
          " days</strong> (" + periodNote + ")." + regNote + "</p>" +
        (pred.periodSource === "default"
          ? '<p class="muted">Add last days to logged periods below to personalize period length.</p>'
          : "") +
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

    var ends = data.periodEnds || {};
    var html = '<div class="card"><h2>Logged periods</h2>';
    for (var i = 0; i < starts.length; i++) {
      var d = starts[i];
      var iso = toIso(d);
      var meta = (i < starts.length - 1)
        ? Cycle.daysBetween(starts[i + 1], d) + "-day cycle"
        : "first logged";
      var end = ends[iso];
      var durMeta = end
        ? " · " + (Cycle.daysBetween(new Date(iso + "T00:00:00"), new Date(end + "T00:00:00")) + 1) + "-day period"
        : " · length not set";
      html += '<div class="history-item">' +
        '<div class="hist-main"><div>' + fmt(d) + "</div>" +
          '<div class="meta">' + meta + durMeta + "</div></div>" +
        '<div class="hist-controls">' +
          '<label class="end-label">ended <input type="date" data-end="' + iso + '" min="' + iso + '" value="' + (end || "") + '" /></label>' +
          '<button data-del="' + iso + '">Remove</button>' +
        "</div>" +
      "</div>";
    }
    html += "</div>";
    container.innerHTML = html;

    container.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var iso = btn.getAttribute("data-del");
        data.periods = data.periods.filter(function (p) { return p !== iso; });
        delete data.periodEnds[iso];
        Store.save(data);
        renderHistory();
        renderDaily();
      });
    });

    container.querySelectorAll("[data-end]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var start = inp.getAttribute("data-end");
        var val = inp.value;
        if (val && val >= start) data.periodEnds[start] = val;
        else delete data.periodEnds[start];
        Store.save(data);
        renderHistory();
        renderDaily();
      });
    });
  }

  /* ---------- Calendar tab ---------- */

  var calMonth = null; // first-of-month Date currently displayed

  function calendarModel() {
    var starts = (data.periods || [])
      .map(function (p) { return new Date(p + "T00:00:00"); })
      .sort(function (a, b) { return a - b; });
    return {
      starts: starts,
      cyc: Cycle.averageCycle(data.periods, data.cycleLength || 28).length,
      per: Cycle.averagePeriodLength(data.periodEnds, data.periodLength || 5).length
    };
  }

  // Is this date within a logged period (start..end, or start..start+per-1)?
  function isLoggedPeriodDay(d, model) {
    var ends = data.periodEnds || {};
    for (var i = 0; i < model.starts.length; i++) {
      var s = model.starts[i];
      var endIso = ends[toIso(s)];
      var end = endIso ? new Date(endIso + "T00:00:00") : Cycle.addDays(s, model.per - 1);
      if (d >= s && d <= end) return true;
    }
    return false;
  }

  // Phase/markers for a calendar date, projecting forward past the last log.
  function calDayInfo(d, model) {
    var starts = model.starts;
    if (!starts.length || d < starts[0]) return {};
    var base = null, baseIdx = -1;
    for (var i = 0; i < starts.length; i++) {
      if (starts[i] <= d) { base = starts[i]; baseIdx = i; }
    }
    var cs = base, projected = false;
    if (baseIdx === starts.length - 1) { // beyond last log -> project by avg cycle
      var k = Math.floor(Cycle.daysBetween(cs, d) / model.cyc);
      if (k > 0) { cs = Cycle.addDays(cs, k * model.cyc); projected = true; }
    }
    var doc = Cycle.daysBetween(cs, d) + 1;
    var ovuDay = model.cyc - 13;
    var info = { dayOfCycle: doc, projected: projected };
    if (doc <= model.per) info.phase = "menstrual";
    else if (doc === ovuDay) info.phase = "ovulation";
    else if (doc < ovuDay) info.phase = "follicular";
    else info.phase = "luteal";
    info.fertile = (doc >= ovuDay - 5 && doc <= ovuDay && info.phase !== "ovulation");
    info.logged = isLoggedPeriodDay(d, model);
    return info;
  }

  function loggedDataDays() {
    var set = {};
    (data.notes || []).forEach(function (n) { set[n.date] = true; });
    (data.encounters || []).forEach(function (e) { set[e.date] = true; });
    return set;
  }

  function renderCalendar() {
    if (!calMonth) calMonth = new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1);
    document.getElementById("cal-title").textContent =
      calMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    var model = calendarModel();
    var dataDays = loggedDataDays();
    var y = calMonth.getFullYear(), m = calMonth.getMonth();
    var startDow = new Date(y, m, 1).getDay();
    var daysIn = new Date(y, m + 1, 0).getDate();
    var todayIso = toIso(new Date());

    var html = '<div class="cal-grid">';
    ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach(function (d) {
      html += '<div class="cal-dow">' + d + "</div>";
    });
    for (var b = 0; b < startDow; b++) html += '<div class="cal-cell cal-empty"></div>';
    for (var day = 1; day <= daysIn; day++) {
      var d = new Date(y, m, day);
      var iso = toIso(d);
      var info = calDayInfo(d, model);
      var cls = ["cal-cell"];
      if (info.phase) cls.push("cal-" + info.phase);
      if (info.logged) cls.push("cal-logged");
      if (iso === todayIso) cls.push("cal-today");
      var marks = "";
      if (info.phase === "ovulation") marks += "⭐";
      else if (info.fertile) marks += "💧";
      if (info.logged) marks += "🩸";
      var dot = dataDays[iso] ? '<span class="cal-dot"></span>' : "";
      html += '<div class="' + cls.join(" ") + '">' +
        '<span class="cal-num">' + day + "</span>" +
        '<span class="cal-marks">' + marks + "</span>" + dot +
      "</div>";
    }
    html += "</div>";
    document.getElementById("cal-grid").innerHTML = html;

    document.getElementById("cal-legend").innerHTML = model.starts.length
      ? '<span class="lg"><span class="sw cal-menstrual"></span>Menstrual</span>' +
        '<span class="lg"><span class="sw cal-follicular"></span>Follicular</span>' +
        '<span class="lg"><span class="sw cal-ovulation"></span>Ovulation</span>' +
        '<span class="lg"><span class="sw cal-luteal"></span>Luteal</span>' +
        '<span class="lg">⭐ ovulation · 💧 fertile · 🩸 logged period · • note/intimacy</span>'
      : '<span class="muted">Log a period in History to populate the calendar.</span>';

    renderTripWeeks();
  }

  function setupCalendarControls() {
    document.getElementById("cal-prev").addEventListener("click", function () {
      calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1);
      renderCalendar();
    });
    document.getElementById("cal-next").addEventListener("click", function () {
      calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1);
      renderCalendar();
    });
  }

  /* ---------- Suggested trip windows ----------
   * Scores candidate windows over the next year by how much falls in her
   * high-energy window (follicular → ovulation), and surfaces the best one per
   * projected cycle. Trip length is selectable. */
  var TRIP_TYPES = {
    weekend: { label: "Weekend (Fri–Sun)", startDow: 5, length: 3 },
    week:    { label: "Week (Sun–Sun)",    startDow: 0, length: 8 }
  };

  function tripType() { return TRIP_TYPES[data.tripType] ? data.tripType : "week"; }

  // Back up to the most recent occurrence of weekday `dow` (0=Sun..6=Sat).
  function alignToDow(d, dow) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() - dow + 7) % 7));
    return x;
  }

  function tripWeight(info, cyc) {
    if (!info || !info.phase) return 0;
    if (info.phase === "menstrual") return 0;
    if (info.phase === "ovulation") return 5;
    if (info.phase === "follicular") return info.fertile ? 4 : 3;
    // luteal: good early, drops off toward PMS
    var ovuDay = cyc - 13, doc = info.dayOfCycle;
    if (doc <= ovuDay + 5) return 2;
    if (doc >= cyc - 2) return 0;
    return 1;
  }

  function windowScore(start, model, length) {
    var total = 0, phases = {};
    for (var i = 0; i < length; i++) {
      var d = Cycle.addDays(start, i);
      var info = calDayInfo(d, model);
      total += tripWeight(info, model.cyc);
      if (info.phase) phases[info.phase] = (phases[info.phase] || 0) + 1;
    }
    return { total: total, phases: phases };
  }

  function tripReason(phases) {
    var bright = (phases.follicular || 0) + (phases.ovulation || 0);
    if (bright >= 5) return "her high-energy peak — great for an active or social getaway";
    if (bright >= 3) return "mostly her rising-energy stretch";
    if ((phases.luteal || 0) >= 4) return "a calmer, cozy window";
    if ((phases.menstrual || 0) >= 3) return "overlaps her period — lower energy";
    return "a mixed week";
  }

  function computeTripWeeks() {
    var model = calendarModel();
    if (!model.starts.length) return [];
    var t = TRIP_TYPES[tripType()];
    var cyc = model.cyc;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var firstStart = alignToDow(today, t.startDow);
    var lastStart = model.starts[model.starts.length - 1];
    var horizon = new Date(today); horizon.setFullYear(horizon.getFullYear() + 1);

    var weeks = [], seen = {}, guard = 0, k = 0;
    while (guard++ < 400) {
      var cs = Cycle.addDays(lastStart, k * cyc);
      k++;
      if (cs > horizon) break;
      var center = Cycle.addDays(cs, (cyc - 14) - Math.floor(t.length / 2)); // peak, centered for the length
      if (Cycle.addDays(center, t.length) < today) continue; // whole window already past
      var base = alignToDow(center, t.startDow);
      var best = null;
      [-1, 0, 1].forEach(function (off) {
        var start = Cycle.addDays(base, off * 7);
        if (start < firstStart || start > horizon) return;
        var sc = windowScore(start, model, t.length);
        if (!best || sc.total > best.score) best = { start: start, score: sc.total, phases: sc.phases };
      });
      if (best && !seen[toIso(best.start)]) {
        seen[toIso(best.start)] = true;
        best.end = Cycle.addDays(best.start, t.length - 1);
        best.reason = tripReason(best.phases);
        weeks.push(best);
      }
    }
    weeks.sort(function (a, b) { return a.start - b.start; });
    return weeks;
  }

  function fmtWd(date) {
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  function tripSelectorHtml() {
    var cur = tripType();
    var opts = Object.keys(TRIP_TYPES).map(function (key) {
      return '<option value="' + key + '"' + (key === cur ? " selected" : "") + ">" + TRIP_TYPES[key].label + "</option>";
    }).join("");
    return '<label class="trip-type">Trip length <select id="trip-type-sel">' + opts + "</select></label>";
  }

  function wireTripSelector() {
    var sel = document.getElementById("trip-type-sel");
    if (sel) sel.addEventListener("change", function () {
      data.tripType = sel.value;
      Store.save(data);
      renderTripWeeks();
    });
  }

  function renderTripWeeks() {
    var el = document.getElementById("trip-weeks");
    if (!el) return;
    var weeks = computeTripWeeks();
    var header = '<div class="card"><h2>Trip windows</h2>' + tripSelectorHtml();
    if (!weeks.length) {
      el.innerHTML = header +
        '<p class="muted">Log a period in History to get suggested trip windows for the year ahead.</p></div>';
      wireTripSelector();
      return;
    }
    var maxScore = weeks.reduce(function (m, w) { return Math.max(m, w.score); }, 0);
    var topIso = null; // star only the soonest best window, not every tie
    weeks.forEach(function (w) { if (topIso === null && w.score === maxScore) topIso = toIso(w.start); });
    var rows = weeks.map(function (w) {
      var isTop = toIso(w.start) === topIso;
      return '<button class="trip-item' + (isTop ? " trip-top" : "") + '" data-month="' +
          w.start.getFullYear() + "-" + w.start.getMonth() + '">' +
        '<div class="trip-dates">' + (isTop ? "⭐ " : "") + fmtWd(w.start) + " – " + fmtWd(w.end) + "</div>" +
        '<div class="trip-reason">' + w.reason + "</div>" +
      "</button>";
    }).join("");
    el.innerHTML = header +
      '<p class="muted">Best ' + TRIP_TYPES[tripType()].label.toLowerCase() +
        ' getaways over the next year, ranked by her high-energy window. ⭐ marks the strongest.</p>' +
      rows +
      '<p class="muted" style="margin-top:8px">Estimates from her average cycle — windows further out are less certain.</p></div>';

    wireTripSelector();
    el.querySelectorAll(".trip-item").forEach(function (b) {
      b.addEventListener("click", function () {
        var mp = b.getAttribute("data-month").split("-");
        calMonth = new Date(+mp[0], +mp[1], 1);
        renderCalendar();
      });
    });
  }

  /* ---------- Journal tab ---------- */

  var STAGE_LABEL = {
    menstrual: "Menstrual",
    follicular: "Follicular",
    ovulation: "Ovulation",
    luteal_early: "Early luteal",
    luteal_late: "Late luteal"
  };
  var STAGE_ORDER = ["menstrual", "follicular", "ovulation", "luteal_early", "luteal_late"];

  function renderJournal() {
    renderPatterns();
    renderTimeline();
  }

  function renderPatterns() {
    var container = document.getElementById("patterns-content");
    if (!data.periods.length) {
      container.innerHTML = '<div class="card empty">Log a period in History first, then your notes and encounters can be matched to cycle phases.</div>';
      return;
    }
    var learned = Learn.analyze(data);
    var rows = "";
    STAGE_ORDER.forEach(function (k) {
      var s = learned.encounters[k];
      var kws = Learn.topKeywords(learned.notes[k], 3);
      if (!s && !kws.length) return;
      var enc = s
        ? "🔥 " + s.avgDesire.toFixed(1) + " · 🌶️ " + s.avgAdventure.toFixed(1) +
          " · " + INITIATOR_TEXT[s.initiator] + " (" + s.count + ")"
        : '<span class="muted">no encounters logged</span>';
      var notes = kws.length ? "📝 " + kws.join(", ") : "";
      rows += '<div class="pattern-row"><div class="pattern-stage">' + STAGE_LABEL[k] + "</div>" +
        '<div class="pattern-data">' + enc + (notes ? "<br>" + notes : "") + "</div></div>";
    });
    container.innerHTML = rows
      ? '<div class="card"><h2>Patterns learned</h2>' + rows +
        '<p class="muted" style="margin-top:10px">The Intimacy outlook blends these averages into its advice — more logs mean a more personalized read.</p></div>'
      : '<div class="card empty">No notes or encounters logged yet. Add some above to start spotting patterns.</div>';
  }

  function renderTimeline() {
    var container = document.getElementById("journal-timeline");
    var items = [];
    (data.notes || []).forEach(function (n) {
      items.push({ type: "note", date: n.date, id: n.id, text: n.text });
    });
    (data.encounters || []).forEach(function (e) {
      items.push({ type: "enc", date: e.date, id: e.id, desire: e.desire, adventure: e.adventure, initiator: e.initiator });
    });
    if (!items.length) { container.innerHTML = ""; return; }
    items.sort(function (a, b) { return a.date < b.date ? 1 : -1; });

    var html = '<div class="card"><h2>Journal timeline</h2>';
    items.forEach(function (it) {
      var d = new Date(it.date + "T00:00:00");
      var c = data.periods.length ? Cycle.classifyDate(data.periods, data, d) : null;
      var phaseTag = c ? '<span class="phase-tag phase-' + c.phaseKey + '">' + STAGE_LABEL[c.stageKey] + "</span>" : "";
      var body;
      if (it.type === "note") {
        body = "📝 " + escapeHtml(it.text);
      } else {
        body = "💞 Desire 🔥" + it.desire + " · Adventure 🌶️" + it.adventure + " · " +
          (it.initiator === "her" ? "she initiated" : it.initiator === "him" ? "I initiated" : "mutual");
      }
      html += '<div class="journal-item">' +
        '<div class="journal-head"><span>' + fmt(d) + "</span>" + phaseTag +
          '<button data-jdel="' + it.type + ":" + it.id + '">Remove</button></div>' +
        '<div class="journal-body">' + body + "</div>" +
      "</div>";
    });
    html += "</div>";
    container.innerHTML = html;

    container.querySelectorAll("[data-jdel]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var parts = btn.getAttribute("data-jdel").split(":");
        var type = parts[0], id = parts.slice(1).join(":");
        if (type === "note") data.notes = data.notes.filter(function (n) { return String(n.id) !== id; });
        else data.encounters = data.encounters.filter(function (e) { return String(e.id) !== id; });
        Store.save(data);
        renderJournal();
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
    document.getElementById("set-intimacy").checked = data.showIntimacy !== false;
    document.getElementById("set-positions").checked = data.showPositions !== false;
    var rem = data.reminders || {};
    document.getElementById("rem-enabled").checked = !!rem.enabled;
    document.getElementById("rem-period").checked = rem.period !== false;
    document.getElementById("rem-ovulation").checked = rem.ovulation !== false;
    document.getElementById("rem-pms").checked = rem.pms !== false;
    document.getElementById("rem-phase").checked = rem.phase !== false;
    updateRemStatus();
    var stored = Store.backendName() === "capacitor-preferences"
      ? "Stored privately in durable device storage (Capacitor)."
      : "Stored privately in this browser on this device (localStorage).";
    document.getElementById("storage-note").textContent = "🔒 " + stored;
    updateSunPreview();
  }

  function updateRemStatus() {
    var el = document.getElementById("rem-status");
    if (!el) return;
    if (!("Notification" in window)) { el.textContent = "This browser doesn’t support notifications."; return; }
    if (!data.reminders || !data.reminders.enabled) { el.textContent = ""; return; }
    if (Notification.permission === "granted") el.textContent = "🔔 Reminders on — they show when you open the app.";
    else if (Notification.permission === "denied") el.textContent = "Notifications are blocked in your browser settings; enable them there to receive reminders.";
    else el.textContent = "Tap Save settings to allow notifications.";
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
        if (name === "calendar") renderCalendar();
        if (name === "history") renderHistory();
        if (name === "journal") renderJournal();
        if (name === "settings") renderSettings();
      });
    });
  }

  function setupHistoryControls() {
    var dateInput = document.getElementById("log-date");
    var endInput = document.getElementById("log-end");
    dateInput.value = toIso(new Date());
    document.getElementById("log-add").addEventListener("click", function () {
      var v = dateInput.value;
      if (!v) return;
      if (data.periods.indexOf(v) === -1) data.periods.push(v);
      var end = endInput.value;
      if (end && end >= v) data.periodEnds[v] = end;
      Store.save(data);
      endInput.value = "";
      renderHistory();
      renderDaily();
    });
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function setupJournalControls() {
    var today = toIso(new Date());
    document.getElementById("note-date").value = today;
    document.getElementById("enc-date").value = today;

    document.getElementById("note-add").addEventListener("click", function () {
      var date = document.getElementById("note-date").value;
      var text = document.getElementById("note-text").value.trim();
      if (!date || !text) return;
      data.notes.push({ id: uid(), date: date, text: text });
      Store.save(data);
      document.getElementById("note-text").value = "";
      renderJournal();
      renderDaily();
    });

    document.getElementById("enc-add").addEventListener("click", function () {
      var date = document.getElementById("enc-date").value;
      if (!date) return;
      data.encounters.push({
        id: uid(),
        date: date,
        desire: parseInt(document.getElementById("enc-desire").value, 10),
        adventure: parseInt(document.getElementById("enc-adventure").value, 10),
        initiator: document.getElementById("enc-initiator").value
      });
      Store.save(data);
      renderJournal();
      renderDaily();
    });
  }

  function setupSettingsControls() {
    document.getElementById("set-birthday").addEventListener("change", updateSunPreview);

    document.getElementById("set-save").addEventListener("click", function () {
      data.name = document.getElementById("set-name").value.trim();
      data.birthday = document.getElementById("set-birthday").value;
      data.cycleLength = clampNum(document.getElementById("set-cycle").value, 20, 45, 28);
      data.periodLength = clampNum(document.getElementById("set-period").value, 1, 10, 5);
      data.showIntimacy = document.getElementById("set-intimacy").checked;
      data.showPositions = document.getElementById("set-positions").checked;
      data.reminders = {
        enabled: document.getElementById("rem-enabled").checked,
        period: document.getElementById("rem-period").checked,
        ovulation: document.getElementById("rem-ovulation").checked,
        pms: document.getElementById("rem-pms").checked,
        phase: document.getElementById("rem-phase").checked
      };
      Store.save(data);
      var status = document.getElementById("save-status");
      status.textContent = "Saved ✓";
      setTimeout(function () { status.textContent = ""; }, 2000);
      // Ask for notification permission when reminders are turned on.
      if (data.reminders.enabled && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then(function () { updateRemStatus(); renderDaily(); });
      } else {
        updateRemStatus();
      }
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

    // Export: download all data as a JSON file (fully on-device, no network).
    document.getElementById("set-export").addEventListener("click", function () {
      exportBackup();
      backupStatus("Backup downloaded ✓");
    });

    // Import: restore from a previously exported JSON file.
    var fileInput = document.getElementById("set-import-file");
    document.getElementById("set-import").addEventListener("click", function () {
      fileInput.value = "";
      fileInput.click();
    });
    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var parsed;
        try { parsed = JSON.parse(reader.result); }
        catch (e) { backupStatus("Couldn't read that file (not valid JSON).", true); return; }
        if (!parsed || typeof parsed !== "object" ||
            (parsed.periods && !Array.isArray(parsed.periods)) ||
            (parsed.notes && !Array.isArray(parsed.notes)) ||
            (parsed.encounters && !Array.isArray(parsed.encounters))) {
          backupStatus("That doesn't look like a HerRhythm backup.", true);
          return;
        }
        if (!confirm("Importing will replace all current data with the backup. Continue?")) return;
        data = Store.replaceAll(parsed);
        renderSettings();
        renderHistory();
        renderJournal();
        renderDaily();
        backupStatus("Backup restored ✓");
      };
      reader.readAsText(file);
    });
  }

  function backupStatus(msg, isError) {
    var s = document.getElementById("backup-status");
    s.textContent = msg;
    s.style.color = isError ? "var(--period)" : "var(--fertile)";
    setTimeout(function () { s.textContent = ""; }, 4000);
  }

  // Download all data as a JSON file and record the backup time.
  function exportBackup() {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "herrhythm-backup-" + toIso(new Date()) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    data.lastBackupAt = new Date().toISOString();
    data.backupSnoozeUntil = "";
    Store.save(data);
  }

  // Decide whether to nudge the user to back up. Returns "" or a reason.
  var BACKUP_STALE_DAYS = 14;
  var BACKUP_SNOOZE_DAYS = 3;

  function backupNudgeReason() {
    var hasData = (data.periods.length + data.notes.length + data.encounters.length) > 0;
    if (!hasData) return "";
    var now = Date.now();
    if (data.backupSnoozeUntil && now < Date.parse(data.backupSnoozeUntil)) return "";
    if (!data.lastBackupAt) return "never";
    var days = (now - Date.parse(data.lastBackupAt)) / 86400000;
    return days >= BACKUP_STALE_DAYS ? "stale" : "";
  }

  function backupNudgeHtml() {
    var reason = backupNudgeReason();
    if (!reason) return "";
    var msg = reason === "never"
      ? "You haven't backed up yet. Your data lives only on this device — download a backup so you don't risk losing it."
      : "It's been over " + BACKUP_STALE_DAYS + " days since your last backup. A quick export keeps your history safe.";
    return '<div class="card nudge">' +
      '<div class="nudge-msg">🔔 ' + msg + "</div>" +
      '<div class="nudge-actions">' +
        '<button id="nudge-backup" class="btn">Back up now</button>' +
        '<button id="nudge-snooze" class="btn btn-secondary">Remind me later</button>' +
      "</div>" +
    "</div>";
  }

  function wireBackupNudge() {
    var b = document.getElementById("nudge-backup");
    if (b) b.addEventListener("click", function () {
      exportBackup();
      renderDaily();
    });
    var s = document.getElementById("nudge-snooze");
    if (s) s.addEventListener("click", function () {
      data.backupSnoozeUntil = new Date(Date.now() + BACKUP_SNOOZE_DAYS * 86400000).toISOString();
      Store.save(data);
      renderDaily();
    });
  }

  function clampNum(v, min, max, fallback) {
    var n = parseInt(v, 10);
    if (isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function init() {
    // Hydrate data from the (possibly async) storage backend before rendering.
    Store.init().then(function (loaded) {
      data = loaded;
      setupTabs();
      setupHistoryControls();
      setupCalendarControls();
      setupJournalControls();
      setupSettingsControls();
      renderDaily();
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  // Register the service worker for offline support + notifications.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
