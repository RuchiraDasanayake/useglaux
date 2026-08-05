import OwlMark from "../components/OwlMark";
import { CONTACT_EMAIL, WORDMARK } from "../lib/brand";
import type { LegalDocument } from "./documents";

export default function LegalApp({ document }: { document: LegalDocument }) {
  return (
    <>
      <a className="skip-link" href="#legal-content">
        Skip to legal content
      </a>
      <header className="legal-nav">
        <a className="legal-nav__brand" href="/" aria-label="Glaux home">
          <OwlMark size={24} />
          {WORDMARK}
        </a>
        <a className="link-arrow link-arrow--sm" href="/">
          Back to company
        </a>
      </header>

      <main className="legal-shell" id="legal-content" tabIndex={-1}>
        <header className="legal-hero">
          <p className="eyebrow">
            <span className="dot" aria-hidden="true" />
            Legal
          </p>
          <h1>{document.title}</h1>
          <p className="legal-hero__summary">{document.summary}</p>
          <p className="legal-hero__effective">Effective {document.effective}</p>
        </header>

        <div className="legal-document">
          {document.sections.map((section) => (
            <section className="legal-section" key={section.title}>
              <h2>{section.title}</h2>
              <div className="legal-section__body">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.items && (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="legal-footer">
        <p>© {new Date().getFullYear()} Glaux. All rights reserved.</p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </footer>
    </>
  );
}
