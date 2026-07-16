/* storage.js — persistence for HerRhythm.
 *
 * The persistence backend is pluggable:
 *   - Web, signed out (default): browser localStorage (synchronous).
 *   - Signed in: Supabase (see createSupabaseBackend), so an account's data
 *     follows the user across devices. Row-level security scopes every read
 *     and write to auth.uid(), so one user can never see another's data.
 *   - Mobile (Capacitor): if the @capacitor/preferences plugin is present,
 *     it is detected automatically and used instead of localStorage — durable
 *     native storage that is NOT subject to browser cache eviction.
 *
 * Backends may be synchronous (localStorage) or asynchronous (Supabase,
 * Capacitor), so the data is hydrated once into an in-memory cache at startup
 * via init(). After that, load() is a synchronous read of the cache and
 * save() writes through to the backend (awaitable, but callers can
 * fire-and-forget).
 */
(function (global) {
  "use strict";

  // Storage key intentionally kept from the original "Luna" name so existing
  // users' data survives the rebrand to HerRhythm. Do not rename without a migration.
  var KEY = "luna.data.v1";

  var DEFAULTS = {
    name: "",
    birthday: "",        // "YYYY-MM-DD"
    cycleLength: 28,
    periodLength: 5,
    showIntimacy: true,  // show the Intimacy outlook card on the Daily tab
    showPositions: true, // show the suggested-position idea within that card
    reminders: { enabled: false, period: true, ovulation: true, pms: true, phase: true },
    lastNotified: {},    // map of reminder key -> ISO date it last fired (per-day dedupe)
    tripType: "week",    // suggested-trip length: "weekend" (Fri–Sun) or "week" (Sun–Sun)
    theme: "system",     // "system" | "light" | "dark"
    lastBackupAt: "",    // ISO datetime of the last export, for the backup nudge
    backupSnoozeUntil: "", // ISO datetime to suppress the backup nudge until
    periods: [],         // array of "YYYY-MM-DD" period start dates
    periodEnds: {},      // map of startISO -> endISO (optional), for learning period length
    notes: [],           // [{ id, date, text }]
    encounters: []       // [{ id, date, desire:1-5, adventure:1-5, initiator:"her"|"him"|"mutual" }]
  };

  var cache = null;

  function freshDefaults() {
    return JSON.parse(JSON.stringify(DEFAULTS)); // deep copy so arrays aren't shared
  }

  function merge(parsed) {
    return Object.assign(freshDefaults(), parsed || {});
  }

  function parse(raw) {
    if (!raw) return freshDefaults();
    try { return merge(JSON.parse(raw)); }
    catch (e) { return freshDefaults(); }
  }

  /* ---- Pluggable backends ---- */

  var localStorageBackend = {
    name: "localStorage",
    getItem: function (k) { try { return global.localStorage.getItem(k); } catch (e) { return null; } },
    setItem: function (k, v) { try { global.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    removeItem: function (k) { try { global.localStorage.removeItem(k); } catch (e) {} }
  };

  // Detect Capacitor Preferences (durable native storage) when running in a
  // Capacitor app; otherwise fall back to localStorage. No code change needed
  // to switch — wrapping the app with Capacitor + @capacitor/preferences is enough.
  function detectBackend() {
    try {
      var cap = global.Capacitor;
      var P = cap && cap.Plugins && cap.Plugins.Preferences;
      if (P) {
        return {
          name: "capacitor-preferences",
          getItem: function (k) { return P.get({ key: k }).then(function (r) { return r.value; }); },
          setItem: function (k, v) { return P.set({ key: k, value: v }).then(function () { return true; }); },
          removeItem: function (k) { return P.remove({ key: k }); }
        };
      }
    } catch (e) {}
    return localStorageBackend;
  }

  // Cloud backend used once a user is signed in. Reads/writes the single
  // user_data row belonging to `userId`; RLS policies enforce that no other
  // user's row is ever visible. Mirrors to a local cache so a transient
  // network failure falls back to the last-known data instead of resetting
  // the UI to defaults.
  function createSupabaseBackend(client, userId) {
    var cacheKey = "herrhythm.cache." + userId;
    function readCache() {
      try { return global.localStorage.getItem(cacheKey); } catch (e) { return null; }
    }
    function writeCache(raw) {
      try { global.localStorage.setItem(cacheKey, raw); } catch (e) {}
    }

    return {
      name: "supabase",
      getItem: function () {
        return client.from("user_data").select("data").eq("user_id", userId).maybeSingle()
          .then(function (res) {
            if (res.error) throw res.error;
            var raw = res.data ? JSON.stringify(res.data.data) : null;
            if (raw) writeCache(raw);
            return raw;
          })
          .catch(function () { return readCache(); });
      },
      setItem: function (k, v) {
        writeCache(v);
        return client.from("user_data")
          .upsert({ user_id: userId, data: JSON.parse(v) }, { onConflict: "user_id" })
          .then(function (res) { if (res.error) throw res.error; return true; });
      },
      removeItem: function () {
        try { global.localStorage.removeItem(cacheKey); } catch (e) {}
        return client.from("user_data").delete().eq("user_id", userId)
          .then(function (res) { if (res.error) throw res.error; });
      }
    };
  }

  var backend = detectBackend();

  function setBackend(b) { backend = b; }
  function backendName() { return backend.name; }

  /* ---- Lifecycle ---- */

  // Hydrate the in-memory cache from the backend. Returns a Promise<data>.
  function init() {
    return Promise.resolve(backend.getItem(KEY)).then(function (raw) {
      cache = parse(raw);
      return cache;
    }).catch(function () {
      cache = freshDefaults();
      return cache;
    });
  }

  function load() {
    return cache || (cache = freshDefaults());
  }

  function save(data) {
    cache = data;
    return Promise.resolve(backend.setItem(KEY, JSON.stringify(data)));
  }

  function clear() {
    cache = freshDefaults();
    return Promise.resolve(backend.removeItem(KEY));
  }

  // Replace all data (used by Import). Merges with defaults, persists, returns it.
  function replaceAll(parsed) {
    cache = merge(parsed);
    save(cache);
    return cache;
  }

  global.Store = {
    init: init,
    load: load,
    save: save,
    clear: clear,
    replaceAll: replaceAll,
    setBackend: setBackend,
    backendName: backendName,
    createSupabaseBackend: createSupabaseBackend,
    localStorageBackend: localStorageBackend,
    DEFAULTS: DEFAULTS
  };
})(typeof window !== "undefined" ? window : this);
