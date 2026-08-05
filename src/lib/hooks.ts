import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/** True while the tab is foregrounded. Used to park the render loop. */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState !== "hidden",
  );

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return visible;
}

/** Observes an element and reports whether any part of it is on screen. */
export function useInView(ref: RefObject<Element | null>, rootMargin = "0px"): boolean {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return inView;
}

/**
 * Fires once the browser is idle (or after `timeout`), so mounting the
 * WebGL canvas can never contend with first contentful paint.
 */
export function useAfterIdle(timeout = 1200): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) setReady(true);
    };

    if (typeof requestIdleCallback === "function") {
      const handle = requestIdleCallback(done, { timeout });
      return () => {
        cancelled = true;
        cancelIdleCallback(handle);
      };
    }

    const handle = window.setTimeout(done, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [timeout]);

  return ready;
}

/** A rectangle in CSS pixels, relative to some origin element. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const EMPTY_BOX: Box = { x: 0, y: 0, width: 0, height: 0 };

/**
 * Measures one element's rectangle relative to another.
 *
 * The hero uses it to hand the 3D scene the box its subject should occupy.
 * That keeps the composition in CSS, where the breakpoints already live: at
 * every width the canvas is told where the layout put the owl rather than
 * guessing from the viewport's aspect ratio, which is what previously left
 * the owl wearing the wordmark on short laptop screens.
 */
export function useElementBox(
  target: RefObject<HTMLElement | null>,
  origin: RefObject<HTMLElement | null>,
): Box {
  const [box, setBox] = useState<Box>(EMPTY_BOX);

  useEffect(() => {
    const targetEl = target.current;
    const originEl = origin.current;
    if (!targetEl || !originEl || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const rect = targetEl.getBoundingClientRect();
      const base = originEl.getBoundingClientRect();
      const next: Box = {
        x: rect.left - base.left,
        y: rect.top - base.top,
        width: rect.width,
        height: rect.height,
      };
      setBox((prev) =>
        prev.x === next.x &&
        prev.y === next.y &&
        prev.width === next.width &&
        prev.height === next.height
          ? prev
          : next,
      );
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(targetEl);
    observer.observe(originEl);
    return () => observer.disconnect();
  }, [target, origin]);

  return box;
}

export interface Pointer {
  /** Position normalised to -1..1 on both axes. */
  x: number;
  y: number;
  /**
   * False on touch screens, where the two zeroes above are a default rather
   * than a reading. Anything aiming itself at the pointer has to know the
   * difference, or on a phone it aims at the middle of the screen and holds
   * that pose for as long as the page is open.
   */
  tracking: boolean;
}

/**
 * Pointer position, written to a ref.
 *
 * The hero stage is `pointer-events: none` so the canvas never intercepts
 * clicks, which also means R3F's own pointer state stays at the origin.
 * Tracking on the window instead keeps parallax alive across the whole
 * viewport and costs one passive listener with no raycasting.
 */
export function usePointerVector(enabled: boolean): RefObject<Pointer> {
  const pointer = useRef<Pointer>({ x: 0, y: 0, tracking: false });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const state = pointer.current;

    const onMove = (event: PointerEvent) => {
      state.x = (event.clientX / window.innerWidth) * 2 - 1;
      state.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const onLeave = () => {
      state.x = 0;
      state.y = 0;
      state.tracking = false;
    };
    const onEnter = () => {
      state.tracking = true;
    };

    state.tracking = true;
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerenter", onEnter);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      state.tracking = false;
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerenter", onEnter);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  return pointer;
}

/**
 * Scroll progress through an element, 0 at the top and 1 once it has fully
 * left the viewport. Written to a ref rather than state: the 3D scene reads
 * it inside its own frame loop, so React never re-renders on scroll.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>): RefObject<number> {
  const progress = useRef(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const height = el.offsetHeight || 1;
      progress.current = Math.min(1, Math.max(0, window.scrollY / height));
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);

  return progress;
}
