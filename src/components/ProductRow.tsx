import type { Product } from "../lib/brand";
import ArrowUpRight from "./ArrowUpRight";
import Reveal from "./Reveal";

/**
 * One entry in the product catalogue: a mono rail carrying its number and
 * status, the name, and the description with its specification beneath.
 *
 * Deliberately not a card. Filled panels are how the Markets dashboard
 * presents data; borrowing them here made the company page look like a
 * screenshot of the product rather than the place it comes from.
 */
export default function ProductRow({
  product,
  index,
  delay = 0,
}: {
  product: Product;
  index: number;
  delay?: number;
}) {
  const live = product.status === "live";
  const linked = Boolean(product.href && product.cta);

  const classes = [
    "product",
    live ? "product--live" : "product--pending",
    linked ? "product--linked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Reveal as="li" className={classes} delay={delay}>
      <div className="product__meta">
        <span className="product__index">{String(index + 1).padStart(2, "0")}</span>
        <span className={`product__status${live ? " product__status--live" : ""}`}>
          {product.statusLabel}
        </span>
      </div>

      <div className="product__head">
        <h3 className="product__name">{product.name}</h3>
        <p className="product__tagline">{product.tagline}</p>
      </div>

      <div className="product__body">
        <p className="product__text">{product.body}</p>

        <ul className="product__facets">
          {product.chips.map((chip) => (
            <li key={chip}>{chip}</li>
          ))}
        </ul>

        {product.href && product.cta && (
          <a className="link-arrow link-arrow--lead" href={product.href}>
            {product.cta}
            <ArrowUpRight size={15} />
          </a>
        )}
      </div>
    </Reveal>
  );
}
