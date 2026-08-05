import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Nav from "./components/Nav";
import Principles from "./components/Principles";
import ProductGrid from "./components/ProductGrid";
import WhatWeDo from "./components/WhatWeDo";
import MotionProvider from "./lib/motion";

export default function App() {
  return (
    <MotionProvider>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Nav />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <WhatWeDo />
        <hr className="rule" />
        <ProductGrid />
        <hr className="rule" />
        <Principles />
      </main>
      <Footer />
    </MotionProvider>
  );
}
