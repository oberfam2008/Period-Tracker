/**
 * HerRhythm — Color tokens
 *
 * Two layers:
 *  1. `palette`  — the raw brand colors. Never reference these directly in
 *                  components; they exist only to feed the semantic tokens.
 *  2. `colors`   — semantic tokens (what a color is *for*). Always consume
 *                  these in UI so the whole app can be re-themed from one place.
 *
 * Design direction: grounded, masculine, caring — earthy and sophisticated,
 * never clinical or feminine. Sourced from nature: forest, stone, ember.
 */

// ---------------------------------------------------------------------------
// 1. Raw palette (source of truth for the brand)
// ---------------------------------------------------------------------------
export const palette = {
  deepForest: '#3A4D3E', // grounded, strong foundation — the primary brand color
  slateInk:   '#4A5A6F', // intelligent, calm — secondary brand color
  warmEmber:  '#C67C4E', // warmth, care, energy — the accent
  charcoal:   '#2A2A2D', // depth — primary text
  stoneGray:  '#9B9B9B', // quiet — secondary text
  warmGray:   '#F4F1ED', // soft, paper-like — app background
  offWhite:   '#FAFAF8', // clean — card surfaces
  pureWhite:  '#FFFFFF', // inputs / highest elevation

  // Derived tints & shades (kept inside the earthy register) ----------------
  forestPressed: '#2F3F33', // primary, pressed/active state
  emberPressed:  '#B06A3E', // accent, pressed/active state
  emberSoft:     '#F0E2D7', // accent wash — badge / highlight backgrounds
  forestSoft:    '#E4EAE3', // primary wash — subtle section backgrounds
  hairline:      '#E7E2DA', // borders & dividers (derived from warmGray)
  brick:         '#9E4A3C', // muted error red — earthy, not a clinical red
} as const;

// ---------------------------------------------------------------------------
// 2. Semantic tokens (use these everywhere)
// ---------------------------------------------------------------------------
export const colors = {
  // Brand / interactive ----------------------------------------------------
  primary:        palette.deepForest,    // primary buttons, active nav, key emphasis
  primaryPressed: palette.forestPressed, // pressed state for primary surfaces
  primarySoft:    palette.forestSoft,    // tinted background for primary contexts

  secondary:      palette.slateInk,      // secondary buttons, links, informational accents

  accent:         palette.warmEmber,     // CTAs, highlights, progress, important data
  accentPressed:  palette.emberPressed,  // pressed state for accent surfaces
  accentSoft:     palette.emberSoft,     // accent wash — tags, badges, callouts

  // Text -------------------------------------------------------------------
  text:           palette.charcoal,      // primary text & headings
  textSecondary:  palette.stoneGray,     // captions, metadata, hints
  textInverse:    palette.offWhite,      // text on dark / saturated surfaces
  textOnAccent:   palette.pureWhite,     // text sitting on the ember accent

  // Surfaces ---------------------------------------------------------------
  background:     palette.warmGray,      // screen background
  card:           palette.offWhite,      // cards, sheets, raised containers
  surface:        palette.pureWhite,     // inputs, tiles, highest elevation
  border:         palette.hairline,      // hairlines, dividers, input outlines
  overlay:        'rgba(42, 42, 45, 0.55)', // modal scrim (charcoal @ 55%)

  // Feedback (earthy, not clinical) ----------------------------------------
  success:        palette.deepForest,    // "on track" / confirmations
  warning:        palette.warmEmber,     // attention / gentle alerts
  danger:         palette.brick,         // destructive / errors

  /**
   * Cycle-phase accents — ties each phase to a natural, masculine register.
   * Use for phase chips, timelines, and the current-phase highlight.
   */
  phases: {
    menstrual:  palette.brick,    // clay/brick — rest & reset
    follicular: '#5A7355',        // fresh green — rising energy & growth
    ovulation:  palette.warmEmber,// ember — peak warmth & connection
    luteal:     palette.slateInk, // slate — winding down, inward
  },
} as const;

export type Colors = typeof colors;
export type PhaseKey = keyof typeof colors.phases;
