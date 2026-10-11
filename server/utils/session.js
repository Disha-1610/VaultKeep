// In-memory session store for the single-user vault.
// Only ONE valid session ID (jti) exists at any time.
// A new login or server restart invalidates all previous tokens automatically.

let currentJti = null;

/** Replace the valid session with a fresh ID. */
const setJti = (jti) => {
  currentJti = jti;
};

/** Returns true only if the supplied jti matches the active session. */
const isValidJti = (jti) => typeof jti === "string" && jti === currentJti;

/** Invalidate the current session (used on lock). */
const clearJti = () => {
  currentJti = null;
};

module.exports = { setJti, isValidJti, clearJti };
