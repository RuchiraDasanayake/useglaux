/**
 * Runtime capability probes that decide whether the hero gets the WebGL
 * owl or the static poster. All of them are cheap and run once.
 */

export type DeviceTier = "low" | "mid" | "high";

let webglSupport: boolean | null = null;

/**
 * Probes for a WebGL context once and caches the answer. The throwaway
 * context is explicitly lost so it never counts against the browser's
 * (small) live-context budget.
 */
export function detectWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  if (typeof document === "undefined") return (webglSupport = false);

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    webglSupport = Boolean(gl);
    if (gl && "getExtension" in gl) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/**
 * Coarse device banding. The scene is light, so only phones and genuinely
 * constrained machines are pushed to the poster; everything else gets the
 * canvas with a tier-appropriate DPR cap.
 */
export function detectTier(): DeviceTier {
  if (typeof window === "undefined") return "low";

  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const width = window.innerWidth;

  if (coarse && width < 768) return "low";
  if (cores <= 2 || memory <= 2) return "low";
  if (coarse || width < 1280) return "mid";
  return "high";
}

/** Max device pixel ratio per tier. Never exceeds the display's own ratio. */
export const DPR_CAP: Record<DeviceTier, number> = {
  low: 1,
  mid: 1.25,
  high: 1.75,
};
