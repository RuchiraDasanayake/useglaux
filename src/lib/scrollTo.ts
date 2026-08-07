import { useEffect } from "react";

/**
 * In-page navigation, animated in JS rather than by `scroll-behavior`.
 *
 * The CSS property is still there as the fallback, but on its own it gives
 * every jump the same duration and the same near-linear curve, so a nudge
 * from the hero to the section below it and a jump from the footer back to
 * the top feel equally mechanical. Here the distance sets the duration and
 * the page eases in and out on the same curve as everything else on it.
 *
 * A drag, a wheel or a key press abandons the animation immediately: a page
 * that keeps flying to a heading after you have started scrolling yourself
 * is the reason smooth scrolling has a bad name.
 */

const MIN_DURATION = 420;
const MAX_DURATION = 940;

/** The shared `--ease-out` curve, evaluated per frame. */
function ease(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function offsetForNav(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--nav-bar-h");
  return (Number.parseFloat(raw) || 60) + 20;
}

function targetOffset(hash: string): number | null {
  if (hash === "#top") return 0;
  const el = document.querySelector(hash);
  if (!(el instanceof HTMLElement)) return null;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const top = el.getBoundingClientRect().top + window.scrollY - offsetForNav();
  return Math.max(0, Math.min(top, max));
}

/**
 * Keeps the target as the place the next Tab continues from, which is what
 * the browser would have done had the anchor not been intercepted.
 */
function handOverFocus(hash: string) {
  const el = hash === "#top" ? document.getElementById("top") : document.querySelector(hash);
  if (!(el instanceof HTMLElement)) return;

  const hadTabIndex = el.hasAttribute("tabindex");
  if (!hadTabIndex) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  if (!hadTabIndex) {
    el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true });
  }
}

export function useSmoothAnchors() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let stop: (() => void) | null = null;

    const abort = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      stop?.();
      stop = null;
    };

    const run = (to: number, hash: string) => {
      const from = window.scrollY;
      const distance = to - from;
      if (Math.abs(distance) < 2) {
        handOverFocus(hash);
        return;
      }

      const duration = Math.min(
        MAX_DURATION,
        Math.max(MIN_DURATION, Math.abs(distance) * 0.42 + 220),
      );
      const start = performance.now();

      const onInterrupt = () => abort();
      window.addEventListener("wheel", onInterrupt, { passive: true });
      window.addEventListener("touchstart", onInterrupt, { passive: true });
      window.addEventListener("keydown", onInterrupt);
      stop = () => {
        window.removeEventListener("wheel", onInterrupt);
        window.removeEventListener("touchstart", onInterrupt);
        window.removeEventListener("keydown", onInterrupt);
      };

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        window.scrollTo(0, from + distance * ease(t));
        if (t < 1) {
          frame = requestAnimationFrame(step);
          return;
        }
        frame = 0;
        stop?.();
        stop = null;
        handOverFocus(hash);
      };

      frame = requestAnimationFrame(step);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a");
      // The skip link has to land instantly, and its focus move is the
      // whole point of it, so it keeps the browser's own behaviour.
      if (!link || link.classList.contains("skip-link")) return;

      const hash = link.getAttribute("href");
      if (!hash || !hash.startsWith("#") || hash.length < 2) return;

      const to = targetOffset(hash);
      if (to === null) return;

      event.preventDefault();
      abort();

      if (reduced.matches) {
        window.scrollTo(0, to);
        handOverFocus(hash);
      } else {
        run(to, hash);
      }

      if (window.location.hash !== hash) history.pushState(null, "", hash);
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      abort();
    };
  }, []);
}
