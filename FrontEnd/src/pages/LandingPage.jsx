import SiteHeader from "../components/landing/site-header";
import HeroSection from "../components/landing/heroSection";
import FeaturesSection from "../components/landing/featuresSection";
import { TechSection, SiteFooter } from "../components/landing/techSection";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
      <SiteHeader />

      <main className="flex-1">
        <div id="solucion">
          <HeroSection />
        </div>

        <FeaturesSection />

        <TechSection />
      </main>

      <SiteFooter />
    </div>
  );
}
