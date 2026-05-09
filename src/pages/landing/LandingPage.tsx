import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { CtaSection } from '@/components/landing/CtaSection';
import { About } from '@/components/landing/About';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <About />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
