import { useEffect, useRef, useState } from "react";
import { MARKETS_URL, WORDMARK } from "../lib/brand";
import ArrowUpRight from "./ArrowUpRight";
import OwlMark from "./OwlMark";

/**
 * Held back until the hero has been scrolled past, so the first viewport
 * carries exactly one brand signal: the wordmark itself.
 */
export default function Nav() {
  const [visible, setVisible] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > window.innerHeight * 0.72;
      if (next === shown.current) return;
      shown.current = next;
      setVisible(next);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav${visible ? " is-visible" : ""}`} aria-hidden={!visible}>
      <nav className="nav__inner shell" aria-label="Primary">
        <a className="nav__brand" href="#top" tabIndex={visible ? 0 : -1}>
          <OwlMark size={22} />
          {WORDMARK}
        </a>
        <div className="nav__links">
          <a className="nav__link" href="#what" tabIndex={visible ? 0 : -1}>
            What we do
          </a>
          <a className="nav__link" href="#products" tabIndex={visible ? 0 : -1}>
            Products
          </a>
          <a className="nav__link" href="#principles" tabIndex={visible ? 0 : -1}>
            Principles
          </a>
          <a
            className="link-arrow link-arrow--sm link-arrow--lead"
            href={MARKETS_URL}
            tabIndex={visible ? 0 : -1}
          >
            Open Glaux Markets
            <ArrowUpRight size={13} />
          </a>
        </div>
      </nav>
    </header>
  );
}
