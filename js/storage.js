/* storage.js — localStorage persistence for Luna. */
(function (global) {
  "use strict";

  var KEY = "luna.data.v1";

  var DEFAULTS = {
    name: "",
    birthday: "",        // "YYYY-MM-DD"
    cycleLength: 28,
    periodLength: 5,
    periods: []          // array of "YYYY-MM-DD" period start dates
  };

  function load() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      var parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULTS, parsed);
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function save(data) {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clear() {
    try { global.localStorage.removeItem(KEY); } catch (e) {}
  }

  global.Store = { load: load, save: save, clear: clear, DEFAULTS: DEFAULTS };
})(typeof window !== "undefined" ? window : this);
