import { useReducedMotion, type Transition, type Variants } from "motion/react";

/**
 * Centralized motion presets for page/section entrances.
 *
 * Conventions:
 * - Import the library from "motion/react" (matches the rest of the codebase).
 * - All entrance durations are <= 0.4s with a gentle ease-out curve (AC 21.3).
 * - Presets are exposed as `Variants` keyed by "hidden" / "show", ready for
 *   `<motion.div variants={fadeUp} initial="hidden" animate="show">` or
 *   `whileInView="show"`.
 * - Reduced-motion is respected via the `use*` hooks below, which collapse
 *   transforms/parallax to an instant opacity-only change (AC 21.4).
 */

/** Entrance duration in seconds. Kept <= 0.4s per AC 21.3. */
export const ENTRANCE_DURATION = 0.3;

/** Gentle ease-out curve (easeOutExpo-like) for soft, non-jarring entrances. */
export const ENTRANCE_EASE: Transition["ease"] = [0.16, 1, 0.3, 1];

/** Shared transition used by the full-motion presets. */
const entranceTransition: Transition = {
  duration: ENTRANCE_DURATION,
  ease: ENTRANCE_EASE,
};

/**
 * Transition used when the system requests reduced motion: collapse the
 * duration to ~0 so the element simply appears (opacity-only, no movement).
 */
const reducedTransition: Transition = { duration: 0 };

/**
 * Fade in while sliding up a short distance. The workhorse entrance for
 * headings, paragraphs and section blocks.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: entranceTransition },
};

/** Fade in with no movement. Use where translation would feel out of place. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: entranceTransition },
};

/**
 * Pop in: fade plus a subtle scale-up. Good for cards, badges and CTAs that
 * should feel a touch more lively than a plain fade.
 */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: entranceTransition },
};

/**
 * Container variant that staggers the entrance of its children. Pair with any
 * of the item presets above on the children:
 *
 *   <motion.ul variants={staggerContainer} initial="hidden" animate="show">
 *     <motion.li variants={fadeUp} />
 *   </motion.ul>
 */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

/** All built-in entrance item presets, addressable by name. */
const ENTRANCE_PRESETS = {
  fadeUp,
  fadeIn,
  popIn,
} as const;

export type EntrancePresetName = keyof typeof ENTRANCE_PRESETS;

/**
 * Opacity-only, instant variants for reduced-motion users. No transforms
 * (y/scale/x) and a ~0s duration, so the element simply appears.
 */
const reducedVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: reducedTransition },
};

/**
 * Returns the entrance preset for the given name, automatically respecting the
 * user's reduced-motion preference. When reduced motion is requested the
 * returned variants are opacity-only with a ~0s duration (no transform /
 * parallax); otherwise the full preset is returned.
 *
 * Must be called inside a React component (it relies on `useReducedMotion`).
 */
export function useEntrancePreset(name: EntrancePresetName = "fadeUp"): Variants {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? reducedVariants : ENTRANCE_PRESETS[name];
}

/** Reduced-motion-aware `fadeUp` preset. */
export function useFadeUp(): Variants {
  return useEntrancePreset("fadeUp");
}

/** Reduced-motion-aware `popIn` preset. */
export function usePopIn(): Variants {
  return useEntrancePreset("popIn");
}

/** Reduced-motion-aware `fadeIn` preset. */
export function useFadeIn(): Variants {
  return useEntrancePreset("fadeIn");
}
