import { CODA, PRINCIPLES } from "../lib/brand";
import Reveal from "./Reveal";

export default function Principles() {
  return (
    <section className="section" id="principles">
      <div className="shell">
        <Reveal>
          <div className="section__head section__head--split">
            <span className="eyebrow">
              <span className="dot" />
              Principles
            </span>
            <div className="section__intro">
              <h2 className="section__title">How we decide what to ship.</h2>
              <p className="section__lead">
                Four constraints that keep every instrument useful, inspectable and honest.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="principles">
          {PRINCIPLES.map((principle, index) => (
            <Reveal className="principle" key={principle.index} delay={index * 0.06}>
              <span className="principle__index">{principle.index}</span>
              <h3 className="principle__title">{principle.title}</h3>
              <p className="principle__body">{principle.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="principles__coda">{CODA}</p>
        </Reveal>
      </div>
    </section>
  );
}
