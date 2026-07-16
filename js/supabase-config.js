/* supabase-config.js — project connection details for HerRhythm's shared
 * (multi-user, login-based) backend. The publishable key is safe to expose
 * client-side: it has no privileges on its own, and every table is protected
 * by row-level security policies scoped to auth.uid().
 */
(function (global) {
  "use strict";
  global.SUPABASE_CONFIG = {
    url: "https://aydxndyopdskcasaqvuw.supabase.co",
    publishableKey: "sb_publishable_uMriXUOiADAikIi7VXetmw_XnAGetnt"
  };
})(typeof window !== "undefined" ? window : this);
