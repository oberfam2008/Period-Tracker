/* auth.js — thin wrapper around Supabase Auth for HerRhythm.
 *
 * Wraps sign up / sign in / sign out / password reset behind a small API so
 * app.js doesn't touch the Supabase client directly. All data access is
 * gated by an account: row-level security on the `user_data` table means a
 * signed-in user can only ever read or write their own row.
 */
(function (global) {
  "use strict";

  var cfg = global.SUPABASE_CONFIG;
  var client = null;

  if (cfg && cfg.url && cfg.publishableKey && global.supabase && global.supabase.createClient) {
    client = global.supabase.createClient(cfg.url, cfg.publishableKey);
  }

  function requireClient() {
    if (!client) {
      throw new Error("Supabase isn't configured — check js/supabase-config.js and that the Supabase JS CDN script loaded.");
    }
    return client;
  }

  function unwrap(promise) {
    return promise.then(function (res) {
      if (res.error) throw res.error;
      return res.data;
    });
  }

  function getSession() {
    return unwrap(requireClient().auth.getSession()).then(function (d) { return d.session; });
  }

  // cb(event, session) — event is one of Supabase's auth events, e.g.
  // "INITIAL_SESSION", "SIGNED_IN", "SIGNED_OUT", "PASSWORD_RECOVERY",
  // "TOKEN_REFRESHED".
  function onAuthStateChange(cb) {
    return requireClient().auth.onAuthStateChange(cb);
  }

  function signUp(email, password) {
    return unwrap(requireClient().auth.signUp({ email: email, password: password }));
  }

  function signIn(email, password) {
    return unwrap(requireClient().auth.signInWithPassword({ email: email, password: password }));
  }

  function signOut() {
    return unwrap(requireClient().auth.signOut());
  }

  function sendPasswordReset(email) {
    var redirectTo = global.location.origin + global.location.pathname;
    return unwrap(requireClient().auth.resetPasswordForEmail(email, { redirectTo: redirectTo }));
  }

  function updatePassword(newPassword) {
    return unwrap(requireClient().auth.updateUser({ password: newPassword }));
  }

  global.Auth = {
    isConfigured: function () { return !!client; },
    client: function () { return client; },
    getSession: getSession,
    onAuthStateChange: onAuthStateChange,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    sendPasswordReset: sendPasswordReset,
    updatePassword: updatePassword
  };
})(typeof window !== "undefined" ? window : this);
