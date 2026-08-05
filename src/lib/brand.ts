/**
 * Single source of truth for names, URLs and marketing copy.
 * Mirrors `src/lib/brand.ts` in the Glaux Markets product so the two
 * properties never drift on naming or positioning.
 */

export const COMPANY_NAME = "Glaux";
export const WORDMARK = "GLAUX";

export const MARKETS_URL = import.meta.env.VITE_MARKETS_URL ?? "https://markets.useglaux.com";
export const CONTACT_EMAIL = "support@useglaux.com";

export const HERO = {
  headline: "We build instruments for reading risk.",
  sub: "Glaux designs calibrated, regime-aware intelligence systems. Transparent about what they know, and honest about what they don't.",
  primaryCta: "Open Glaux Markets",
  secondaryCta: "Explore",
} as const;

export const WHAT = {
  eyebrow: "What Glaux does",
  title: "One job: make risk legible before it matters.",
  body: [
    "Every domain worth measuring changes regime faster than its models adapt. A system tuned on last quarter's conditions keeps answering confidently long after the ground has moved. The failure is quiet, which is what makes it expensive.",
    "Glaux builds systems that measure volatility and regime directly, state their confidence in terms you can check, and re-estimate as conditions shift. We publish the method and the track record alongside the output.",
    "The result is a clearer read on the risk you are actually carrying. Not a prediction to follow, and not a number to trust blindly.",
  ],
} as const;

export type ProductStatus = "live" | "development";

export interface Product {
  id: string;
  name: string;
  status: ProductStatus;
  statusLabel: string;
  tagline: string;
  body: string;
  chips: readonly string[];
  href?: string;
  cta?: string;
}

export const PRODUCTS: readonly Product[] = [
  {
    id: "markets",
    name: "Glaux Markets",
    status: "live",
    statusLabel: "Live",
    tagline: "Risk-first market intelligence",
    body: "Calibrated volatility and regime estimates across crypto and the Colombo Stock Exchange, distilled to one read. Every forecast carries its confidence, and the track record is public.",
    chips: ["Volatility", "Regime", "Calibration", "Public track record"],
    href: MARKETS_URL,
    cta: "Open Glaux Markets",
  },
  {
    id: "agro",
    name: "Glaux Agro",
    status: "development",
    statusLabel: "In development",
    tagline: "Yield and climate risk intelligence",
    body: "The same regime-aware approach applied to growing seasons: yield variance, weather shocks and the supply risk that follows them.",
    chips: ["Yield variance", "Climate regime", "Supply risk"],
  },
] as const;

export const PRINCIPLES = [
  {
    index: "01",
    title: "Transparent",
    body: "Methods, assumptions and performance are published. A system you cannot inspect is a system you cannot reasonably trust.",
  },
  {
    index: "02",
    title: "Adaptive",
    body: "Conditions change. Models that assume otherwise keep answering with the same confidence while quietly going wrong. Ours are built to notice.",
  },
  {
    index: "03",
    title: "Risk-first",
    body: "We estimate uncertainty before we estimate direction. Risk is the primary output here, not the disclaimer printed underneath one.",
  },
  {
    index: "04",
    title: "Calibrated",
    body: "A stated 70% confidence should be right about 70% of the time. We measure that, report it, and correct the model when it drifts.",
  },
] as const;

export const CODA =
  "We do not sell signals, promise returns, or claim an edge we cannot evidence. What we publish is measurement, with its uncertainty attached.";

export const DISCLAIMER =
  "Glaux provides analytical intelligence only. Nothing published by Glaux or any Glaux product constitutes financial, investment, or trading advice, or a recommendation to buy or sell any instrument. Markets carry risk; decisions and their outcomes remain your own.";
