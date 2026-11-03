/**
 * SIMPLE_MODE: the calm, beginner version of Say it.
 * true  = six types -> how you want them to feel -> 3 best lines with one-tap copy. Nothing else on screen.
 * false = the full version (More menu, Prep card, Practice out loud, Say it differently, Share, My lines,
 *         quick mode, card details, review mode, home-screen shortcuts).
 * No feature code or saved data is removed either way; flip this one value to switch back.
 * The full version is also saved as the git tag and branch `full-version`.
 */
export const SIMPLE_MODE = true

/** The six feelings shown in the simple version, in order (the full version shows all 14).
 *  Chosen for everyday use and phrase coverage: every type gets at least 13 lines for each. */
export const SIMPLE_FEELINGS = ['heard', 'understood', 'comfortable', 'liked', 'trusted', 'respected']
