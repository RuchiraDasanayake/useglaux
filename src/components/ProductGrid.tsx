import { PRODUCTS } from "../lib/brand";
import ProductRow from "./ProductRow";
import Reveal from "./Reveal";

export default function ProductGrid() {
  return (
    <section className="section" id="products">
      <div className="shell">
        <Reveal>
          <div className="section__head section__head--split">
            <span className="eyebrow">
              <span className="dot" />
              Products
            </span>
            <div className="section__intro">
              <h2 className="section__title">One instrument per domain.</h2>
              <p className="section__lead">
                Each Glaux product is a separate application with its own data, its own models and
                its own published record. They share a method, not a dashboard.
              </p>
            </div>
          </div>
        </Reveal>

        <ol className="products">
          {PRODUCTS.map((product, index) => (
            <ProductRow key={product.id} product={product} index={index} delay={index * 0.08} />
          ))}

          <Reveal as="li" className="product product--future" delay={0.16}>
            <div className="product__meta">
              <span className="product__index">{String(PRODUCTS.length + 1).padStart(2, "0")}</span>
              <span className="product__status">Open</span>
            </div>
            <div className="product__head">
              <h3 className="product__name">More to come</h3>
            </div>
            <div className="product__body">
              <p className="product__text">
                A domain is added once its risk model earns the place. Nothing ships to look busy.
              </p>
            </div>
          </Reveal>
        </ol>
      </div>
    </section>
  );
}
