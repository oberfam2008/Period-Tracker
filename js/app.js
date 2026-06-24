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
      { emoji: "🛋️", name: "Under-the-blanket full-body hug", note: "warmth and closeness first, motion optional." }
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
      { emoji: "🌅", name: "Slow build from kissing into missionary", note: "lots of warm-up, then settle in close." }
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
      { emoji: "🎚️", name: "Start in missionary, roll into her on top", note: "trade who leads partway through." }
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
      { emoji: "🎶", name: "Slow dance that turns into standing sex", note: "build the mood, then let it escalate." }
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
      { emoji: "🔀", name: "Swap who's in control, taking turns leading", note: "trade the lead back and forth for a playful power game." }
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
        if (name === "journal") renderJournal();
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
    setupJournalControls();
    setupSettingsControls();
    renderDaily();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
