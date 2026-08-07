import { useEffect, useRef, useState } from "react";
import { WORDMARK } from "../lib/brand";
import OwlMark from "./OwlMark";

const sections = ["what", "products", "principles"] as const;
type SectionId = (typeof sections)[number];

/**
 * Held back until the hero has been scrolled past, so the first viewport
 * carries exactly one brand signal: the wordmark itself.
 */
export default function Nav() {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const shown = useRef(false);
  const progressRef = useRef<HTMLSpanElement>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    // Measuring the document inside the scroll handler reads layout on every
    // frame. It only changes when the page does, so it is cached here and
    // refreshed by the observer below.
    let scrollable = document.documentElement.scrollHeight - window.innerHeight;

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null;

        // Two thresholds, not one: with a single line the bar flickers in
        // and out for anyone resting exactly on it.
        const y = window.scrollY;
        const next = shown.current ? y > window.innerHeight * 0.5 : y > window.innerHeight * 0.72;
        if (next !== shown.current) {
          shown.current = next;
          setVisible(next);
        }

        const progress = scrollable > 0 ? Math.min(y / scrollable, 1) : 0;
        progressRef.current?.style.setProperty("--scroll-progress", String(progress));
      });
    };

    const remeasure = () => {
      scrollable = document.documentElement.scrollHeight - window.innerHeight;
      onScroll();
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", remeasure, { passive: true });
    const observer = new ResizeObserver(remeasure);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", remeasure);
      observer.disconnect();
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (current) setActiveSection(current.target.id as SectionId);
      },
      { rootMargin: "-24% 0px -58% 0px", threshold: [0, 0.1, 0.25] },
    );

    sections.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header className={`nav${visible ? " is-visible" : ""}`} aria-hidden={!visible}>
      <nav className="nav__inner shell" aria-label="Primary">
        <a className="nav__brand" href="#top" tabIndex={visible ? 0 : -1}>
          <OwlMark size={22} />
          {WORDMARK}
        </a>
        <div className="nav__links">
          <a
            className="nav__link"
            href="#what"
            tabIndex={visible ? 0 : -1}
            aria-current={activeSection === "what" ? "location" : undefined}
          >
            What we do
          </a>
          <a
            className="nav__link"
            href="#products"
            tabIndex={visible ? 0 : -1}
            aria-current={activeSection === "products" ? "location" : undefined}
          >
            Products
          </a>
          <a
            className="nav__link"
            href="#principles"
            tabIndex={visible ? 0 : -1}
            aria-current={activeSection === "principles" ? "location" : undefined}
          >
            Principles
          </a>
        </div>
      </nav>
      <span className="nav__progress" ref={progressRef} aria-hidden="true" />
    </header>
  );
}
