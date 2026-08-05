import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { HERO, MARKETS_URL, WORDMARK } from "../lib/brand";
import { detectTier, detectWebGL } from "../lib/capability";
import type { DeviceTier } from "../lib/capability";
import {
  useAfterIdle,
  useElementBox,
  useInView,
  usePageVisible,
  usePointerVector,
  useScrollProgress,
} from "../lib/hooks";
import ArrowUpRight from "./ArrowUpRight";
import HeroPoster from "./hero/HeroPoster";
import Hero3DErrorBoundary from "./hero/Hero3DErrorBoundary";

// three + @react-three are reachable only from here, so the WebGL runtime
// stays out of the initial payload entirely.
const Hero3D = lazy(() => import("./hero/Hero3D"));

interface Capabilities {
  webgl: boolean;
  tier: DeviceTier;
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const idle = useAfterIdle();
  const inView = useInView(heroRef, "240px");
  const pageVisible = usePageVisible();
  const scrollProgress = useScrollProgress(heroRef);
  const slot = useElementBox(slotRef, heroRef);

  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  // Probed after idle so neither the WebGL context probe nor the canvas
  // mount can contend with first contentful paint.
  useEffect(() => {
    if (!idle) return;
    setCapabilities({ webgl: detectWebGL(), tier: detectTier() });
  }, [idle]);

  const tier = capabilities?.tier ?? "low";
  const allow3D = Boolean(capabilities?.webgl) && tier !== "low" && !reducedMotion;
  const pointer = usePointerVector(allow3D);
  const active = allow3D && inView && pageVisible;

  return (
    <section className="hero" id="top" ref={heroRef}>
      <div className="hero__stage">
        <div className={`hero__layer${canvasReady ? " hero__layer--hidden" : ""}`}>
          <HeroPoster />
        </div>
        {allow3D && (
          <Hero3DErrorBoundary onError={() => setCanvasReady(false)}>
            <Suspense fallback={null}>
              <Hero3D
                tier={tier}
                active={active}
                pointer={pointer}
                scrollProgress={scrollProgress}
                slot={slot}
                onReady={() => setCanvasReady(true)}
                onContextLost={() => setCanvasReady(false)}
              />
            </Suspense>
          </Hero3DErrorBoundary>
        )}
      </div>

      <div className="hero__scrim" />

      <div className="hero__grid shell">
        {/* Reserves the owl's share of the composition. Measured, not drawn. */}
        <div className="hero__slot" ref={slotRef} aria-hidden="true" />

        <div className="hero__content">
          <h1 className="hero__title">
            <span className="hero__wordmark">{WORDMARK}</span>
            <span className="hero__headline">{HERO.headline}</span>
          </h1>

          <p className="hero__sub">{HERO.sub}</p>

          <div className="hero__cta">
            <a className="btn" href={MARKETS_URL}>
              {HERO.primaryCta}
              <ArrowUpRight size={15} />
            </a>
            <a className="link-arrow" href="#what">
              {HERO.secondaryCta}
            </a>
          </div>
        </div>
      </div>

      <div className="hero__foot shell">
        <a className="hero__scroll" href="#what">
          <span>Scroll</span>
          <span className="hero__scroll-line" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
