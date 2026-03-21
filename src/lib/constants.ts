// ── Single source of truth for auth constants ────────────────
// Import these wherever you need them. Never hardcode 'joycard_token'
// as a string literal — a single typo silently breaks all auth.

export const AUTH_COOKIE_NAME = 'joycard_token'
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
